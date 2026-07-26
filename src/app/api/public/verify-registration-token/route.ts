import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/firebase/firebase-admin.config";

const schema = z.object({
  token: z.string().min(1, "Token is required"),
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

    const { token } = parsed.data;

    // Search for token
    const tokenSnap = await adminDb
      .collection("registration_tokens")
      .where("token", "==", token)
      .limit(1)
      .get();

    if (tokenSnap.empty) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error: "This registration link is invalid.",
        },
        { status: 400 }
      );
    }

    const tokenDoc = tokenSnap.docs[0];
    const data = tokenDoc.data();

    // Check if used
    if (data.used) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error: "This registration link has already been used.",
        },
        { status: 400 }
      );
    }

    // Check expiry
    const expiresAt = data.expiresAt.toDate();
    if (new Date() > expiresAt) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error: "This registration link has expired.",
        },
        { status: 400 }
      );
    }

    // Check if email already registered (redundancy safety)
    const existingUserSnap = await adminDb
      .collection("users")
      .where("email", "==", data.email)
      .limit(1)
      .get();

    if (!existingUserSnap.empty) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error: "An account with this email has already been registered.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        valid: true,
        email: data.email,
        yearLevel: 1, // Freshmen
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[POST /api/public/verify-registration-token]", error);
    return NextResponse.json(
      { success: false, error: `Failed to verify token. ${error.message || error}` },
      { status: 500 }
    );
  }
}
