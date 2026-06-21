import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/firebase/firebase-admin.config";
import { Program } from "@/features/organization/members/types";

type VerifyStudentRequest = {
  studentId?: string;
  program?: string;
};

const normalize = (value: string | undefined | null) =>
  (value ?? "").trim().toLowerCase();

const buildProgramCandidates = (program: Program | null) => {
  if (!program) return [];

  return Array.from(
    new Set(
      [program.id, program.name, program.acronym, program.shortName, program.code]
        .filter(Boolean)
        .map((value) => normalize(String(value)))
    )
  );
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as VerifyStudentRequest;
    const studentId = body.studentId?.trim();
    const requestedProgram = normalize(body.program);

    if (!studentId) {
      return NextResponse.json(
        {
          success: false,
          error: "Student ID is required.",
        },
        { status: 400 }
      );
    }

    if (!requestedProgram) {
      return NextResponse.json(
        {
          success: false,
          error: "Program is required.",
        },
        { status: 400 }
      );
    }

    const userSnapshot = await adminDb
      .collection("users")
      .where("studentId", "==", studentId)
      .where("isDeleted", "==", false)
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      return NextResponse.json(
        {
          success: false,
          error: "Student record not found.",
        },
        { status: 404 }
      );
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();

    if (userData.status !== "approved") {
      return NextResponse.json(
        { 
          success: false, 
          error: "Your account is not yet approved. Please contact the administrator to proceed." 
        }, 
        { status: 403 } // 403 Forbidden is more appropriate than 404 here
      );
    }

    if (userData.role && userData.role !== "user") {
      return NextResponse.json(
        {
          success: false,
          error: "Student record not found.",
        },
        { status: 404 }
      );
    }

    let program: Program | null = null;
    if (userData.programId) {
      const programDoc = await adminDb.collection("programs").doc(userData.programId).get();
      if (programDoc.exists) {
        program = {
          id: programDoc.id,
          ...programDoc.data(),
        } as Program;
      }
    }

    const allowedProgramValues = buildProgramCandidates(program);

    if (!allowedProgramValues.includes(requestedProgram)) {
      return NextResponse.json(
        {
          success: false,
          error: "Student ID and program do not match our records.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      student: {
        id: userDoc.id,
        studentId: userData.studentId,
        name: `${userData.firstName ?? ""} ${userData.lastName ?? ""}`.trim(),
        firstName: userData.firstName ?? "",
        lastName: userData.lastName ?? "",
        program: program
          ? {
              id: program.id,
              name: program.name,
              acronym: program.acronym,
              shortName: program.shortName,
              code: program.code ?? null,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Error verifying public student:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to verify student.",
      },
      { status: 500 }
    );
  }
}
