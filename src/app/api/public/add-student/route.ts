import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/firebase/firebase-admin.config";
import { FieldValue } from "firebase-admin/firestore";

const schema = z.object({
    studentId: z
      .string()
      .min(1, "Student ID is required")
      .regex(
        /^\d{2}-\d-\d{5}$/,
        "Student ID must follow format XX-X-XXXXX (e.g., 25-1-12345)"
      ),
    email: z.string().min(5, "Email is required").email("Invalid email"),
    firstName: z.string().min(2, "First name is required"),
    lastName: z.string().min(2, "Last name is required"),
    programId: z.string().min(1, "Program is required"),
    yearLevel: z.number().min(1, "Year level is required").max(6, "Year level is too high").default(1),
    role: z.enum(["user"]).default("user"),
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
                    issues: parsed.error.flatten(),
                },
                { status: 400 }
            );
        }

        const { studentId, email, firstName, lastName, programId, role, yearLevel } = parsed.data;

        const [studentIdSnap, emailSnap] = await Promise.all([
            adminDb.collection("users").where("studentId", "==", studentId).limit(1).get(),
            adminDb.collection("users").where("email", "==", email).limit(1).get(),
        ]);

        if (!studentIdSnap.empty) {
            return NextResponse.json(
                { success: false, error: "Student ID already exists." },
                { status: 400 }
            );
        }

        if (!emailSnap.empty) {
            return NextResponse.json(
                { success: false, error: "Email already exists." },
                { status: 400 }
            );
        }

        // ── Validate program ─────────────────────────────────────────────────
        const programDoc = await adminDb.collection("programs").doc(programId).get();
        if (!programDoc.exists) {
            return NextResponse.json(
                { success: false, error: "Program not found." },
                { status: 404 }
            );
        }

        const facultyId: string = programDoc.data()!.facultyId;       

        const userRef = await adminDb.collection("users").add({
            studentId,
            email,
            firstName,
            lastName,
            programId,
            role,
            yearLevel,
            registrationAt: FieldValue.serverTimestamp(),
            status: "pending",
            facultyId: facultyId,
            isDeleted: false,
            createdAt: FieldValue.serverTimestamp(),
        });
        const userId = userRef.id;

        if (role !== "user") {
            return NextResponse.json(
                { success: true, userId, message: "User member added successfully." },
                { status: 201 }
            );
        }

        return NextResponse.json(
            { success: true, userId, message: "Member added successfully." },
            { status: 201 }
        );
    } catch (error) {
        console.error("[POST /api/members]", error);
        return NextResponse.json(
            { success: false, error: `Failed to add member. ${error}` },
            { status: 500 }
        );
    }
}