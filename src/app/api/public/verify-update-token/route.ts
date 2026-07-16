import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token")?.trim();

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token is required." },
        { status: 400 }
      );
    }

    const { adminDb } = await import("@/firebase/firebase-admin.config");

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

    const expiresAt: Date = tokenData.expiresAt.toDate();
    if (new Date() > expiresAt) {
      return NextResponse.json(
        { success: false, error: "This update link has expired." },
        { status: 400 }
      );
    }

    // Fetch current student data to pre-fill the form
    const userDoc = await adminDb.collection("users").doc(tokenData.userId).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Student record not found." },
        { status: 404 }
      );
    }

    const userData = userDoc.data()!;

    return NextResponse.json({
      success: true,
      studentId: tokenData.studentId,
      email: tokenData.email,
      userId: tokenData.userId,
      student: {
        firstName: userData.firstName ?? "",
        lastName: userData.lastName ?? "",
        programId: userData.programId ?? "",
        yearLevel: userData.yearLevel ?? 1,
      },
    });
  } catch (error: any) {
    console.error("[GET /api/public/verify-update-token]", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify update token." },
      { status: 500 }
    );
  }
}
