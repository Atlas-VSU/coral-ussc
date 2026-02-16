import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/firebase/firebase-admin.config";

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: "ID token is required" },
        { status: 400 }
      );
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const userDoc = await adminDb.collection("users").doc(uid).get();
    const userData = userDoc.data();

    if(!userData){
      return NextResponse.json(
        { error: "User is not registered" },
        { status: 404 }
      );
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000;

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    });

    // Get the cookie store
    const cookieStore = await cookies();

    cookieStore.set("session", sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    const userRole = userData.role ? String(userData.role) : "user";
    
    cookieStore.set("userRole", userRole, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Error creating session cookie:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 401 }
    );
  }
}
