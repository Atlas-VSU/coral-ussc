import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/firebase/firebase-admin.config";
import { FieldValue } from "firebase-admin/firestore";

const schema = z.object({
  token: z.string().min(1, "Token is required"),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  programId: z.string().min(1, "Program is required"),
  yearLevel: z.coerce.number().min(1).max(6),
  recaptchaToken: z.string().optional(),
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

    const { token, firstName, lastName, programId, yearLevel, recaptchaToken } = parsed.data;

    // ── reCAPTCHA verification ────────────────────────────────────────────────
    const recaptchaSecret = process.env.RECAPTCHA_V2_SECRET_KEY;
    if (recaptchaSecret) {
      if (!recaptchaToken) {
        return NextResponse.json(
          { success: false, error: "reCAPTCHA verification is required." },
          { status: 400 }
        );
      }
      const verifyRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ secret: recaptchaSecret, response: recaptchaToken }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        return NextResponse.json(
          { success: false, error: "reCAPTCHA verification failed. Please try again." },
          { status: 400 }
        );
      }
    }

    // ── Validate token ────────────────────────────────────────────────────────
    const tokenSnap = await adminDb
      .collection("update_tokens")
      .where("token", "==", token)
      .limit(1)
      .get();

    if (tokenSnap.empty) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired update link." },
        { status: 404 }
      );
    }

    const tokenDoc = tokenSnap.docs[0];
    const tokenData = tokenDoc.data();

    if (tokenData.used) {
      return NextResponse.json(
        { success: false, error: "This update link has already been used." },
        { status: 400 }
      );
    }

    if (new Date() > tokenData.expiresAt.toDate()) {
      return NextResponse.json(
        { success: false, error: "This update link has expired." },
        { status: 400 }
      );
    }

    // ── Validate program exists ───────────────────────────────────────────────
    const programDoc = await adminDb.collection("programs").doc(programId).get();
    if (!programDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Selected program not found." },
        { status: 404 }
      );
    }
    const facultyId: string = programDoc.data()!.facultyId;

    // ── Update the user document ──────────────────────────────────────────────
    await adminDb.collection("users").doc(tokenData.userId).update({
      firstName,
      lastName,
      programId,
      yearLevel,
      facultyId,
      email: tokenData.email,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // ── Mark token as used ────────────────────────────────────────────────────
    await adminDb.collection("update_tokens").doc(tokenDoc.id).update({
      used: true,
      usedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json(
      { success: true, message: "Student record updated successfully." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[POST /api/public/update-student]", error);
    return NextResponse.json(
      { success: false, error: `Failed to update record. ${error.message || error}` },
      { status: 500 }
    );
  }
}
