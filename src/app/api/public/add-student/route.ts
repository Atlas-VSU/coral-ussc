import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/firebase/firebase-admin.config";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { use } from "react";
import { PaymentType } from "@/constants/types";

const registerMemberSchema = z.object({
    studentId: z.string().min(1),
    email: z.string().email(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    programId: z.string().min(1),
    role: z.string().min(1),
    yearLevel: z.number().optional()
})

/**
 * Admin SDK version of recalculateClearanceStatus.
 * Recalculates and updates the overall clearance status based on blockingItems.
 * Call this at the end of the POST handler after all fees/fines are assigned.
 */
async function recalculateClearanceStatus(userId: string): Promise<void> {
    const clearanceRef = adminDb.collection("clearanceStatus").doc(userId);
    const snapshot = await clearanceRef.get();

    if (!snapshot.exists) return;

    const clearance = snapshot.data() as {
        blockingItems?: Record<
            string,
            {
                status: string;
                balance: number;
                isRequiredForClearance: boolean;
                pendingReview: boolean;
            }
        >;
        orgId?: string;
    };

    const items = Object.values(clearance.blockingItems ?? {});

    let status: "cleared" | "pending" | "not_cleared" = "cleared";

    const hasUnpaidRequiredItems = items.some(
        (item) =>
            (item.status === "unpaid" || item.balance > 0) &&
            item.isRequiredForClearance
    );

    if (hasUnpaidRequiredItems) {
        const hasPendingReview = items.some(
            (item) =>
                (item.status === "unpaid" || item.balance > 0) &&
                item.isRequiredForClearance &&
                item.pendingReview
        );
        status = hasPendingReview ? "pending" : "not_cleared";
    }

    const now = FieldValue.serverTimestamp();

    await clearanceRef.update({
        status,
        updatedAt: now,
        clearanceDate: status === "cleared" ? now : null,
    });
}

const ORG_ID = process.env.NEXT_PUBLIC_NODE_ENV == "development" ? "5nii7NKwaiTM0ZigxVBcUzQTyTu2" : "sx5DInd4v6c1BdDJV4JsDSDHENl2";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsed = registerMemberSchema.safeParse(body);

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
        const userName = `${firstName} ${lastName}`;

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

        const fineDocRef = adminDb.collection("fines").doc();
        await fineDocRef.set({
            academicYear: "2025-2026",
            semester: "2nd Semester",
            fineItemsCount: 0,
            userId,
            studentId,
            userName,
            facultyId,
            accumulatedAmount: 0,
            balance: 0,
            firstFineIssuedAt: null,
            lastFineIssuedAt: null,
            isDeleted: false,
            metadata: {
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
                isArchived: false
            },
            waivedAt: null,
            waivedBy: null,
            waivedReason: null
        });
        const parentFineId = fineDocRef.id;

        const clearanceRef = adminDb.collection("clearanceStatus").doc(userId);
        await clearanceRef.set({
            userId,
            studentId,
            userName,
            facultyId,
            isArchived: false,
            programId,
            yearLevel,
            isCleared: false,
            blockingItems: {},
            updatedAt: FieldValue.serverTimestamp(),
            createdAt: FieldValue.serverTimestamp(),
            academicYear: "2025-2026",
            semester: "2nd",
            status: "not_cleared",
            lastCalculateAt: FieldValue.serverTimestamp(),
            visibility: "public",
            orgId: ORG_ID
        });

        // need an org ID for this

        const feeItemsSnap = await adminDb
            .collection("feeItems")
            .where("orgId", "==", ORG_ID)
            .where("isArchived", "==", false)
            .get();

        if (!feeItemsSnap.empty) {
            const now = Timestamp.now();
            const CHUNK_SIZE = 100;
            const feeItemDocs = feeItemsSnap.docs;

            for (let i = 0; i < feeItemDocs.length; i += CHUNK_SIZE) {
                const chunk = feeItemDocs.slice(i, i + CHUNK_SIZE);
                const batch = adminDb.batch();
                const blockingItems: Record<string, object> = {};

                chunk.forEach((feeItemDoc) => {
                    const feeItem = feeItemDoc.data();
                    const feeDocRef = adminDb.collection("fees").doc(); // new doc per fee item

                    batch.set(feeDocRef, {
                        orgId: ORG_ID,
                        userId,
                        userName,
                        studentId,
                        feeItemId: feeItemDoc.id,
                        feeType: feeItem.feeType,
                        title: feeItem.title,
                        amount: feeItem.amount,
                        paidAmount: 0,
                        balance: feeItem.amount,
                        status: "unpaid",
                        academicYear: feeItem.academicYear ?? "2025-2026",
                        semester: feeItem.semester ?? "2nd",
                        description: feeItem.description ?? "",
                        eventId: feeItem.eventId ?? null,
                        dueDate: feeItem.dueDate ?? null,
                        isRequiredForClearance: feeItem.isRequiredForClearance,
                        createdBy: ORG_ID,
                        createdAt: now,
                        updatedAt: now,
                        isArchived: false,
                    });

                    // Increment totalStudents on feeItem
                    batch.update(feeItemDoc.ref, {
                        totalStudents: FieldValue.increment(1),
                        updatedAt: now,
                    });

                    // Only blocking items that are required for clearance
                    if (feeItem.isRequiredForClearance) {
                        blockingItems[feeDocRef.id] = {
                            type: PaymentType.FEES,
                            referenceId: feeDocRef.id,
                            title: feeItem.title,
                            balance: feeItem.amount,
                            status: "unpaid",
                            paymentHistory: [],
                            pendingReview: false,
                            isRequiredForClearance: feeItem.isRequiredForClearance,
                        };
                    }
                });

                if (Object.keys(blockingItems).length > 0) {
                    batch.set(
                        clearanceRef,
                        { blockingItems, updatedAt: Timestamp.now() },
                        { merge: true }
                    );
                }

                await batch.commit();
            }
        }

        const eventsSnap = await adminDb
            .collection("events")
            .where("finesGenerated", "==", true)
            .where("isDeleted", "==", false)
            .get();

        if (!eventsSnap.empty) {
            const now = Timestamp.now();
            const CHUNK_SIZE = 20;
            const eventDocs = eventsSnap.docs;

            // Read the parent fine doc to get current fineItemsCount
            const latestFineDoc = await fineDocRef.get();
            let nextItemNumber = (latestFineDoc.data()?.fineItemsCount ?? 0) + 1;
            let totalFineAmount = 0;

            for (let i = 0; i < eventDocs.length; i += CHUNK_SIZE) {
                const chunk = eventDocs.slice(i, i + CHUNK_SIZE);
                const batch = adminDb.batch();
                const blockingItems: Record<string, object> = {};
                let chunkTotalAmount = 0;
                let chunkItemCount = 0;

                for (const eventDoc of chunk) {
                    const event = eventDoc.data();

                    // Fetch fineType for this event
                    const fineTypeDoc = await adminDb
                        .collection("fineTypes")
                        .doc(event.fineTypeId)
                        .get();

                    if (!fineTypeDoc.exists) {
                        console.warn(`Fine type ${event.fineTypeId} not found for event ${eventDoc.id}, skipping.`);
                        continue;
                    }

                    const fineType = { id: fineTypeDoc.id, ...fineTypeDoc.data() } as {
                        id: string;
                        name: string;
                        defaultAmount: number;
                        requiresTimeOut: boolean;
                    };

                    const amount = fineType.requiresTimeOut
                        ? fineType.defaultAmount * 2
                        : fineType.defaultAmount;

                    // Mirror toTimestamp() — use event.date if it's a Timestamp, else now
                    const eventDate =
                        event.date instanceof Timestamp ? event.date : now;
                    const eventName: string = event.name ?? "Unknown Event";

                    const fineItemRef = adminDb
                        .collection("fines")
                        .doc(parentFineId)
                        .collection("fineItems")
                        .doc();

                    batch.set(fineItemRef, {
                        itemNumber: nextItemNumber,
                        fineTypeId: fineType.id,
                        fineTypeName: fineType.name,
                        eventId: eventDoc.id,
                        eventName,
                        eventDate,
                        amount,
                        reason: `Fine for being absent in event ${eventName}`,
                        issuedBy: "System Generated",
                        issuedAt: now,
                        isWaived: false,
                        waivedBy: null,
                        waivedReason: null,
                        waivedAt: null,
                        appealNotes: null,
                        appealedAt: null,
                        appealStatus: null,
                        appealResolvedAt: null,
                        appealResolvedBy: null,
                        metadata: {
                            createdAt: now,
                            updatedAt: now,
                        },
                        isPaid: false,
                        isArchived: false,
                        isPending: false,
                        parentFineId,
                        userId,
                        studentId,
                        userName,
                        orgId: ORG_ID,
                    });

                    blockingItems[fineItemRef.id] = {
                        type: PaymentType.FINES,
                        referenceId: fineItemRef.id,
                        parentFineId,
                        title: eventName,
                        balance: amount,
                        status: "unpaid",
                        pendingReview: false,
                        isRequiredForClearance: true,
                    };

                    chunkTotalAmount += amount;
                    chunkItemCount++;
                    nextItemNumber++;
                }

                if (chunkItemCount === 0) continue;

                // Update the parent fine doc totals
                batch.update(fineDocRef, {
                    accumulatedAmount: FieldValue.increment(chunkTotalAmount),
                    balance: FieldValue.increment(chunkTotalAmount),
                    fineItemsCount: FieldValue.increment(chunkItemCount),
                    lastFineIssuedAt: now,
                    "metadata.updatedAt": now,
                });

                // Merge blockingItems into clearanceStatus
                batch.set(
                    clearanceRef,
                    { blockingItems, updatedAt: now },
                    { merge: true }
                );

                await batch.commit();
                totalFineAmount += chunkTotalAmount;
            }

            // Set firstFineIssuedAt if this is the first fine (mirror runTransaction)
            if (totalFineAmount > 0) {
                await adminDb.runTransaction(async (transaction) => {
                    const latestFine = await transaction.get(fineDocRef);
                    if (!latestFine.exists) return;
                    if (!latestFine.data()?.firstFineIssuedAt) {
                        transaction.update(fineDocRef, {
                            firstFineIssuedAt: Timestamp.now(),
                        });
                    }
                });
            }
        }

        await recalculateClearanceStatus(userId)

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