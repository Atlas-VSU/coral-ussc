import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { adminDb } from "@/firebase/firebase-admin.config";
import { FieldValue } from "firebase-admin/firestore";
import { sendRegistrationEmail } from "@/lib/email";

const schema = z.object({
  email: z.string().min(5, "Email is required").email("Invalid email"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message ?? "Invalid request payload.",
        },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    // Check if a user with this email already exists in users collection
    const existingUserSnap = await adminDb
      .collection("users")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (!existingUserSnap.empty) {
      return NextResponse.json(
        {
          success: false,
          error: "A registered member with this email already exists.",
        },
        { status: 400 }
      );
    }

    // Rate limiting: check for any active tokens created in the last 2 minutes for this email
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const recentTokenSnap = await adminDb
      .collection("registration_tokens")
      .where("email", "==", email)
      .get();

    const hasRecentToken = recentTokenSnap.docs.some((doc) => {
      const data = doc.data();
      if (!data.createdAt) return false;
      const createdAtDate = data.createdAt.toDate();
      return createdAtDate >= twoMinutesAgo;
    });

    if (hasRecentToken) {
      return NextResponse.json(
        {
          success: false,
          error: "A registration link was recently sent. Please check your email or wait 2 minutes before requesting a new one.",
        },
        { status: 429 }
      );
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store in Firestore
    await adminDb.collection("registration_tokens").add({
      email,
      token,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt,
      used: false,
    });

    // Send registration link
    const baseUrl = request.nextUrl.origin;
    const registrationUrl = `${baseUrl}/self-register?token=${token}`;

    const { mocked } = await sendRegistrationEmail(email, registrationUrl);

    return NextResponse.json(
      {
        success: true,
        message: mocked 
          ? "Registration link generated successfully (logged to console for dev)." 
          : "Registration link has been sent to your email.",
        mocked: !!mocked,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[POST /api/public/send-registration-link]", error);
    return NextResponse.json(
      { success: false, error: `Failed to process registration link. ${error.message || error}` },
      { status: 500 }
    );
  }
}
