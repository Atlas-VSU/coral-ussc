import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendRegistrationResultEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const schema = z.object({
            email: z.string().email(),
            registrationStatus: z.enum(["approved", "rejected"]),
        });
        const { email, registrationStatus } = schema.parse(body);
        await sendRegistrationResultEmail(email, registrationStatus);
        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ success: false, error: error.issues }, { status: 400 });
        }
        console.error(error);
        return NextResponse.json({ success: false, error: "Failed to send verification results" }, { status: 500 });
    }
}