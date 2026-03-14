import { NextRequest, NextResponse } from "next/server";
import { adminStorage } from "@/firebase/firebase-admin.config";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const studentId = (formData.get("studentId") as string | null)?.trim();

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided." }, { status: 400 });
    }
    if (!studentId) {
      return NextResponse.json({ success: false, error: "studentId is required." }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Only JPEG, PNG, WebP, or GIF images are accepted." },
        { status: 400 },
      );
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: "File exceeds the 5 MB size limit." },
        { status: 400 },
      );
    }

    const ext = file.name.split(".").pop() ?? "jpg";
    const timestamp = Date.now();
    const destination = `public-receipts/${studentId}/${timestamp}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const bucket = adminStorage.bucket();
    const fileRef = bucket.file(destination);

    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          source: "public_payment_portal",
          studentId,
        },
      },
    });

    // Make the file publicly readable and get its URL
    await fileRef.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error) {
    console.error("[upload-receipt] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload receipt. Please try again." },
      { status: 500 },
    );
  }
}
