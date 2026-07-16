import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminDb, adminStorage } from "@/firebase/firebase-admin.config";
import { FieldValue } from "firebase-admin/firestore";

const ALLOWED_COR_TYPES = ["application/pdf", "image/png", "image/jpeg"];
const MAX_COR_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

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
    yearLevel: z.coerce.number().min(1, "Year level is required").max(6, "Year level is too high").default(1),
    role: z.enum(["user"]).default("user"),
    recaptchaToken: z.string().optional(),
    registrationToken: z.string().min(1, "Registration token is required"),
});

/**
 * Uploads a COR file to Firebase Storage and returns its public URL.
 * Returns null if no file is provided.
 */
async function uploadCOR(corFile: File, studentId: string): Promise<string | null> {
    if (!ALLOWED_COR_TYPES.includes(corFile.type)) {
        throw new Error("COR must be a PDF, PNG, or JPG file.");
    }
    if (corFile.size > MAX_COR_SIZE_BYTES) {
        throw new Error("COR file must be smaller than 5 MB.");
    }

    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!bucketName) {
        throw new Error("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is not configured.");
    }

    const ext = corFile.name.split(".").pop() ?? "pdf";
    const timestamp = Date.now();
    const destination = `cor-uploads/${studentId}/${timestamp}.${ext}`;

    const buffer = Buffer.from(await corFile.arrayBuffer());
    const bucket = adminStorage.bucket(bucketName);
    const fileRef = bucket.file(destination);

    await fileRef.save(buffer, {
        metadata: {
            contentType: corFile.type,
            metadata: {
                source: "self_registration",
                studentId,
            },
        },
    });

    await fileRef.makePublic();
    return `https://storage.googleapis.com/${bucket.name}/${destination}`;
}

export async function POST(request: NextRequest) {
    try {
        // The form sends multipart/form-data so we can include the COR binary.
        const formData = await request.formData();

        const raw = {
            studentId: (formData.get("studentId") as string | null)?.trim() ?? "",
            email: (formData.get("email") as string | null)?.trim() ?? "",
            firstName: (formData.get("firstName") as string | null)?.trim() ?? "",
            lastName: (formData.get("lastName") as string | null)?.trim() ?? "",
            programId: (formData.get("programId") as string | null)?.trim() ?? "",
            yearLevel: formData.get("yearLevel"),
            role: formData.get("role") ?? "user",
            recaptchaToken: (formData.get("recaptchaToken") as string | null) ?? undefined,
            registrationToken: (formData.get("registrationToken") as string | null)?.trim() ?? "",
        };

        const parsed = schema.safeParse(raw);

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

        const { studentId, email, firstName, lastName, programId, role, yearLevel, recaptchaToken, registrationToken } = parsed.data;

        // ── Verify registration token ────────────────────────────────────────
        const tokenSnap = await adminDb
            .collection("registration_tokens")
            .where("token", "==", registrationToken)
            .limit(1)
            .get();

        if (tokenSnap.empty) {
            return NextResponse.json(
                { success: false, error: "Invalid registration token." },
                { status: 400 }
            );
        }

        const tokenDoc = tokenSnap.docs[0];
        const tokenData = tokenDoc.data();

        if (tokenData.used) {
            return NextResponse.json(
                { success: false, error: "This registration link has already been used." },
                { status: 400 }
            );
        }

        const expiresAt = tokenData.expiresAt.toDate();
        if (new Date() > expiresAt) {
            return NextResponse.json(
                { success: false, error: "This registration link has expired." },
                { status: 400 }
            );
        }

        if (tokenData.email.toLowerCase() !== email.toLowerCase()) {
            return NextResponse.json(
                { success: false, error: "Email address does not match the registration link." },
                { status: 400 }
            );
        }

        // reCAPTCHA v2 server-side verification 
        const recaptchaSecret = process.env.RECAPTCHA_V2_SECRET_KEY;
        if (recaptchaSecret) {
            if (!recaptchaToken) {
                return NextResponse.json(
                    { success: false, error: "reCAPTCHA verification is required." },
                    { status: 400 }
                );
            }

            const verifyRes = await fetch(
                "https://www.google.com/recaptcha/api/siteverify",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: new URLSearchParams({
                        secret: recaptchaSecret,
                        response: recaptchaToken,
                    }),
                }
            );
            const verifyData = await verifyRes.json();

            if (!verifyData.success) {
                return NextResponse.json(
                    { success: false, error: "reCAPTCHA verification failed. Please try again." },
                    { status: 400 }
                );
            }
        }

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

        // ── Upload COR to Firebase Storage (if provided) ─────────────────────
        let corURL: string | null = null;
        const corFile = formData.get("corFile") as File | null;
        if (corFile && corFile.size > 0) {
            try {
                corURL = await uploadCOR(corFile, studentId);
            } catch (uploadErr: any) {
                return NextResponse.json(
                    { success: false, error: uploadErr.message ?? "Failed to upload COR." },
                    { status: 400 }
                );
            }
        }

        // ── Save user to Firestore ────────────────────────────────────────────
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
            ...(corURL ? { corURL } : {}),
        });
        const userId = userRef.id;

        // Mark token as used
        await adminDb.collection("registration_tokens").doc(tokenDoc.id).update({
            used: true,
            usedAt: FieldValue.serverTimestamp(),
        });

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