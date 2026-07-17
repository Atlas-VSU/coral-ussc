import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { adminDb } from "@/firebase/firebase-admin.config";
import { FieldValue } from "firebase-admin/firestore";
import { sendUpdateLinkEmail } from "@/lib/email";

const schema = z.object({
  studentId: z
    .string()
    .min(1, "Student ID is required")
    .regex(/^\d{2}-\d-\d{5}$/, "Invalid student ID format"),
  programId: z.string().min(1, "Program is required"),
  email: z.string().email("Invalid email").min(5, "Email is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Invalid request." },
        { status: 400 }
      );
    }

    const { studentId, programId, email } = parsed.data;

    // Verify the student exists, is approved, and matches the provided program
    const userSnap = await adminDb
      .collection("users")
      .where("studentId", "==", studentId)
      .where("isDeleted", "==", false)
      .limit(1)
      .get();

    if (userSnap.empty) {
      return NextResponse.json(
        { success: false, error: "Student record not found." },
        { status: 404 }
      );
    }

    const userDoc = userSnap.docs[0];
    const userData = userDoc.data();

    if (userData.status !== "approved") {
      return NextResponse.json(
        { success: false, error: "Your account is not yet approved." },
        { status: 403 }
      );
    }

    if (userData.programId !== programId) {
      return NextResponse.json(
        { success: false, error: "Student ID and program do not match our records." },
        { status: 404 }
      );
    }

    // Rate limit: no more than one token per student per 2 minutes
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const recentSnap = await adminDb
      .collection("update_tokens")
      .where("studentId", "==", studentId)
      .get();

    const hasRecentToken = recentSnap.docs.some((doc) => {
      const data = doc.data();
      if (!data.createdAt) return false;
      return data.createdAt.toDate() >= twoMinutesAgo;
    });

    if (hasRecentToken) {
      return NextResponse.json(
        {
          success: false,
          error:
            "An update link was recently sent. Please check your email or wait 2 minutes before requesting a new one.",
        },
        { status: 429 }
      );
    }

    // Generate token and store it
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await adminDb.collection("update_tokens").add({
      studentId,
      userId: userDoc.id,
      email,
      token,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt,
      used: false,
    });

    // Send email
    const baseUrl = request.nextUrl.origin;
    const updateUrl = `${baseUrl}/update-record?token=${token}`;
    const { mocked } = await sendUpdateLinkEmail(email, updateUrl);

    return NextResponse.json(
      {
        success: true,
        message: mocked
          ? "Update link generated (logged to console for dev)."
          : "Update link sent to your email.",
        mocked: !!mocked,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[POST /api/public/send-update-link]", error);
    return NextResponse.json(
      { success: false, error: `Failed to send update link. ${error.message || error}` },
      { status: 500 }
    );
  }
}
