import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/firebase/firebase-admin.config";

export async function GET(request: NextRequest) {
  try {
    // Fetch all terms
    const snapshot = await adminDb
      .collection("terms")
      .where("isActive", "==", true)
      .get();

    if (snapshot.empty) {
      return NextResponse.json(
        {
          success: true,
          terms: [],
          message: "No active terms found for payment.",
        },
        { status: 200 }
      );
    }

    // Extract and format the terms
    const terms = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        AY: data.AY || "",
        semester: data.semester || "",
        // Pre-formatting
        displayName: `${data.semester} · A.Y. ${data.AY}`,
      };
    });

    // Sort them so the most recent terms appear at the top
    terms.sort((a, b) => {
      if (a.AY !== b.AY) {
        return b.AY.localeCompare(a.AY); // e.g., "2025-2026" before "2024-2025"
      }
      return b.semester.localeCompare(a.semester);
    });

    return NextResponse.json({ success: true, terms }, { status: 200 });

  } catch (error: unknown) {
    console.error("Error fetching terms [GET /api/public/terms]:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while fetching the terms.",
      },
      { status: 500 }
    );
  }
}