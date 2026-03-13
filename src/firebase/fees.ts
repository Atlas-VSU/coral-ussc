import { Member, MemberData } from "@/features/organization/members/types";
import { collection, doc, getCountFromServer, getDoc, getDocs, orderBy, query, runTransaction, setDoc, Timestamp, updateDoc, where, writeBatch } from "firebase/firestore";
import { db } from "./firebase.config";
import { FeeGenerationSchema } from "@/features/organization/fees/utils/feeGenerationSchema";
import z from "zod";
import { Fee, FeeWithPaymentHistory, PaymentLog } from "@/features/organization/fees/types";
import { getAllStudents, getMembersOfAnOrg } from "./members";
import { setDate } from "date-fns";
import { toast } from "sonner";
import { getCurrentUserData } from "./users";
import { access } from "fs";
import { PaymentStatus } from "@/constants/status";
import { PaymentType } from "@/constants/types";
import { recalculateClearanceStatus } from "./clearance";
import { generateReceiptId } from "@/features/organization/payments/utils";
import { getProofOfPaymentById } from "./payment/read/proofOfPayment";
import { getPaymentHistoryById } from "./payment/read/paymentHistory";

const currentUserName = await getCurrentUserData() as unknown as Member;

export const checkFeeStatusForClearance = async (userId: string, orgId: string) => {
    const feeRef = collection(db, "fees");
    const q = query(
        feeRef, 
        where("userId", "==", userId), 
        where("orgId", "==", orgId), 
        where("isArchived", "==", false)
    );
    
    const feeSnapshot = await getDocs(q);

    const feesWithHistory = await Promise.all(feeSnapshot.docs.map(async (feeDoc) => {
        const feeData = feeDoc.data();
        
        const paymentHistoryRef = collection(db, "fees", feeDoc.id, "paymentHistory");
        
        const paymentHistorySnapshot = await getDocs(paymentHistoryRef);
        
        const paymentHistory = paymentHistorySnapshot.docs.map(paymentDoc => ({
            id: paymentDoc.id,
            ...paymentDoc.data()
        }));

        return {
            id: feeDoc.id,
            ...feeData,
            paymentHistory: paymentHistory
        } as FeeWithPaymentHistory;
    }));

    return feesWithHistory;
}

export const generateFeesForAllStudentsInAnOrg = async (feeData: z.infer<typeof FeeGenerationSchema>, currentUserData: any, eventId?: string) : Promise<void> => {
    const students = await getMembersOfAnOrg(currentUserData) as unknown as MemberData[];
    if (students.length === 0) {
        throw new Error("No students provided");
    }

    const feesCollection = collection(db, "fees");
    const clearanceCollection = collection(db, "clearanceStatus"); // Reference to clearance collection
    const now = Timestamp.now();

    const chunkSize = 200; 
    
    for (let i = 0; i < students.length; i += chunkSize) {
        const chunk = students.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        
        chunk.forEach(async (student: MemberData) => {
            const feeDocRef = doc(feesCollection);
            const studentId = student.id || "";
            
            // 1. Create the Fee Document
            batch.set(feeDocRef, {
                orgId: currentUserData.uid,
                userId: studentId,
                userName: `${student.member.firstName} ${student.member.lastName}`,
                studentId: student.member.studentId,
                feeType: feeData.feeType,
                title: feeData.title,
                amount: feeData.amount,
                paidAmount: 0,
                balance: feeData.amount,
                status: "unpaid",
                academicYear: feeData.academicYear,
                semester: feeData.semester,
                description: feeData.description,
                eventId: eventId || null,
                dueDate: feeData.dueDate,
                isRequiredForClearance: feeData.isRequiredForClearance,
                createdBy: currentUserData.uid,
                createdAt: now,
                updatedAt: now,
                isArchived: false,
            });

            // 2. Update the Student's Clearance Document
            if (studentId) {
                const clearanceDocRef = doc(clearanceCollection, studentId);
                
                batch.set(clearanceDocRef, {
                    blockingItems: {
                        [feeDocRef.id]: {
                            type: PaymentType.FEES,
                            referenceId: feeDocRef.id,
                            title: feeData.title,
                            balance: feeData.amount,
                            status: "unpaid",
                            paymentHistory: [],
                            pendingReview: false,
                            isRequiredForClearance: feeData.isRequiredForClearance
                        }
                    },
                    updatedAt: now
                }, { merge: true });

                await recalculateClearanceStatus(clearanceDocRef.id);
            }
        });
        
        await batch.commit();
    }
}
export const fetchFeesForOrg = async(orgId: string): Promise<Fee[]> => {
    try {
        const feesRef = collection(db, "fees");

        const q = query(
            feesRef,
            where("orgId", "==", orgId),
            where("isArchived", "==", false),
            orderBy("createdAt", "desc")
        )

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as unknown as Fee[];
    } catch (error) {
        console.error("Error fetching fees for org:", error);
        return [];
    }
}

export const fetchUnpaidFeesForOrg = async (): Promise<Fee[]> => {
    try {
        const currentUser = await getCurrentUserData() as unknown as Member;
        const feesRef = collection(db, "fees");

        const q = query(
            feesRef,
            where("orgId", "==", currentUser.id),
            where("isArchived", "==", false),
            where("status", "in", ["unpaid", "partial"]),
            orderBy("createdAt", "desc")
        )

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as unknown as Fee[];
    } catch (error) {
        console.error("Error fetching unpaid fees for org:", error);
        return [];
    }
}


export async function fetchFeeRoster(title: string, academicYear: string) {
  try {
    const feesRef = collection(db, "fees");
    
    // Querying by both title and academicYear ensures accuracy
    const rosterQuery = query(
      feesRef,
      where("title", "==", title),
      where("academicYear", "==", academicYear)
    );

    const snapshot = await getDocs(rosterQuery);
    
    const roster = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return roster;
  } catch (error) {
    console.error("Error fetching roster:", error);
    return [];
  }
}

export async function fetchFee(feeId: string): Promise<Fee | null> {
    try {
        const feeRef = doc(db, "fees", feeId);
        const snapshot = await getDoc(feeRef);
        
        if (snapshot.exists()) {
            return {
                id: snapshot.id,
                ...snapshot.data()
            } as Fee;
        }
        return null;
    } catch (error) {
        console.error("Error fetching fee:", error);
        return null;
    }
}

export async function fetchPaymentLogs(feeId: string) {
    try {
        const logsRef = collection(db, "fees", feeId, "paymentHistory");
        const q = query(logsRef, orderBy("paidAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error fetching payment logs:", error);
        return [];
    }
}

export const getFeeByStudentId = async (studentId: string) => {
    try {
        const feeRef = collection(db, "fees");
        const q = query(
            feeRef,
            where("studentId", "==", studentId),
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            const feeDoc = snapshot.docs[0];
            return {
                id: feeDoc.id,
                ...feeDoc.data()
            } as Fee;
        }
        return null;
    } catch (error) {
        console.error("Error fetching fee by student ID:", error);
        return null;
    }
}

export const recordManualPaymentAndUpdateClearance = async (
    feeId: string, 
    amount: string, 
    method: "gcash" | "cash" | "bank_transfer" | "waiver", 
    adminId: string,   
    studentId: string,
    adminName: string,
    ref?: string
) => {
    try {
        const paymentAmount = parseFloat(amount);
        if (isNaN(paymentAmount) || paymentAmount <= 0) {
            throw new Error("Invalid payment amount");
        }

        const feeRef = doc(db, "fees", feeId);
        const paymentProofRef = doc(collection(db, "proofOfPayments"));
        const subCollectionRef = collection(feeRef, "paymentHistory");
        const newLogRef = doc(subCollectionRef);
        const clearanceRef = doc(db, 'clearanceStatus', studentId);

        const studentData = await getDoc(doc(db, "users", studentId));
        const currentUser = await getCurrentUserData() as unknown as Member;

        await runTransaction(db, async (transaction) => {
            const feeDoc = await transaction.get(feeRef);
            if (!feeDoc.exists()) {
                throw new Error(`Fee document with ID ${feeId} does not exist.`);
            }
            
            const feeData = feeDoc.data() as Fee;
            const currentPaidAmount = feeData.paidAmount || 0;
            const totalRequiredAmount = feeData.amount || 0;

            const newPaidAmount = currentPaidAmount + paymentAmount;
            const newBalance = Math.max(0, totalRequiredAmount - newPaidAmount);
            
            let newStatus: "pending" | "partial" | "paid" = "pending";
            if (newBalance <= 0) {
                newStatus = "paid";
            } else if (newPaidAmount > 0) {
                newStatus = "partial";
            }

            const newLog: PaymentLog = {
                id: newLogRef.id,
                paymentNumber: Date.now(), 
                amount: paymentAmount,
                paymentMethod: method,
                paymentProofId: paymentProofRef.id,
                gcashReference: method === "gcash" && ref ? ref : null,
                status: PaymentStatus.VERIFIED,
                paidAt: Timestamp.now(),
                verifiedBy: adminId, 
                verifiedByName: adminName, 
                verifiedAt: Timestamp.now(),
                rejectionReason: null,
                notes: "Manual payment recorded by admin",
                metadata: null,
                createdAt: Timestamp.now(),
            };

            transaction.set(newLogRef, newLog);
            
            transaction.set(paymentProofRef, {
                id: paymentProofRef.id,
                orgId: currentUser.id,
                userId: studentId,
                studentId: studentData.data()?.studentId,
                userName: studentData.data()?.firstName + " " + studentData.data()?.lastName,
                paymentType: PaymentType.FEES,
                referenceId: feeId,
                paymentHistoryId: newLogRef.id,
                senderNumber: "",
                referenceNumber: method === "gcash" && ref ? ref : "",
                amount: paymentAmount,
                imageUrl: "",
                status: PaymentStatus.VERIFIED,
                submittedAt: Timestamp.now(),
                verifiedBy: adminId,
                verifiedByName: adminName,
                verifiedAt: Timestamp.now(),
                rejectionReason: "",
                notes: "Manual payment recorded by admin",
                metadata: {},
                receiptCode: generateReceiptId(),
            })

            transaction.update(feeRef, {
                paidAmount: newPaidAmount,
                balance: newBalance,
                status: newStatus,
            });

            transaction.update(clearanceRef, {
                [`blockingItems.${feeId}.balance`]: newBalance,
                [`blockingItems.${feeId}.status`]: newBalance <= 0 ? "paid" : "unpaid", 
                [`blockingItems.${feeId}.pendingReview`]: false,
            });
        });

        await recalculateClearanceStatus(studentId);
        return newLogRef.id;
    } catch (error) {
        console.error("Error processing manual payment and clearance:", error);
        throw error;
    }
}

export const approvePaymentTransaction = async (feeId: string, paymentLogId: string, userId: string) => {
    try {
        const feeRef = doc(db, "fees", feeId);
        const paymentLogRef = doc(feeRef, "paymentHistory", paymentLogId);
        const clearanceId = await runTransaction(db, async (transaction) => {
            const feeDoc = await transaction.get(feeRef);
            const paymentLogDoc = await transaction.get(paymentLogRef);

            if (!feeDoc.exists()) {
                throw new Error(`Fee document with ID ${feeId} does not exist.`);
            }

            if (!paymentLogDoc.exists()) {
                throw new Error(`Payment log with ID ${paymentLogId} does not exist.`);
            }

            const feeData = feeDoc.data() as Fee;
            const paymentLogData = paymentLogDoc.data() as PaymentLog;

            const currentPaidAmount = feeData.paidAmount || 0;
            const paymentAmount = paymentLogData.amount;
            const newPaidAmount = currentPaidAmount + paymentAmount;
            const newBalance = Math.max(0, feeData.amount - newPaidAmount);
            let newStatus = "pending";
            if (newBalance <= 0) {
                newStatus = "paid";
            } else if (newPaidAmount > 0) {
                newStatus = "partial";
            }

            transaction.update(paymentLogRef, {
                status: PaymentStatus.VERIFIED,
                verifiedBy: userId,
                verifiedByName: currentUserName.firstName + " " + currentUserName.lastName, 
                verifiedAt: Timestamp.now(),
            });

            if (paymentLogData.paymentProofId) {
                const proofRef = doc(db, "proofOfPayments", paymentLogData.paymentProofId);
                transaction.update(proofRef, {
                    status: PaymentStatus.VERIFIED,
                    verifiedBy: userId,
                    verifiedByName: currentUserName.firstName + " " + currentUserName.lastName,
                    verifiedAt: Timestamp.now(),
                });
            }

            transaction.update(feeRef, {
                paidAmount: newPaidAmount,
                balance: newBalance,
                status: newStatus,
            });

            // Update Student's Clearance Document
            const clearanceRef = doc(db, 'clearanceStatus', feeData.userId);
            transaction.update(clearanceRef, {
                [`blockingItems.${feeId}.balance`]: newBalance,
                [`blockingItems.${feeId}.status`]: newBalance <= 0 ? "paid" : "unpaid",
                [`blockingItems.${feeId}.pendingReview`]: false,
            });
            return clearanceRef.id;
        })

        await recalculateClearanceStatus(clearanceId);
    } catch (error) {
        console.error("Error approving payment:", error);
        throw error;
    }
}

export const rejectPaymentTransaction = async (feeId: string, paymentLogId: string, userId: string, rejectionReason: string) => {
    try {
        const feeRef = doc(db, "fees", feeId);
        const paymentLogRef = doc(feeRef, "paymentHistory", paymentLogId);
        const clearanceId = await runTransaction(db, async (transaction) => {
            const feeDoc = await transaction.get(feeRef);
            const paymentLogDoc = await transaction.get(paymentLogRef);

            if (!feeDoc.exists()) {
                throw new Error(`Fee document with ID ${feeId} does not exist.`);
            }

            if (!paymentLogDoc.exists()) {
                throw new Error(`Payment log with ID ${paymentLogId} does not exist.`);
            }

            const feeData = feeDoc.data() as Fee;
            const paymentLogData = paymentLogDoc.data() as PaymentLog;

            const currentPaidAmount = feeData.paidAmount || 0;
            const paymentAmount = paymentLogData.amount;
            const newPaidAmount = currentPaidAmount - paymentAmount;
            const newBalance = Math.max(0, feeData.amount - newPaidAmount);
            let newStatus = "pending";
            if (newBalance <= 0) {
                newStatus = "paid";
            } else if (newPaidAmount > 0) {
                newStatus = "partial";
            }

            transaction.update(paymentLogRef, {
                status: PaymentStatus.REJECTED,
                verifiedBy: userId,
                verifiedByName: currentUserName.firstName + " " + currentUserName.lastName, 
                verifiedAt: Timestamp.now(),
                rejectionReason: rejectionReason,
            });

            if (paymentLogData.paymentProofId) {
                const proofRef = doc(db, "proofOfPayments", paymentLogData.paymentProofId);
                transaction.update(proofRef, {
                    status: PaymentStatus.REJECTED,
                    verifiedBy: userId,
                    verifiedByName: currentUserName.firstName + " " + currentUserName.lastName,
                    verifiedAt: Timestamp.now(),
                    rejectionReason: rejectionReason,
                });
            }

            transaction.update(feeRef, {
                paidAmount: newPaidAmount,
                balance: newBalance,
                status: newStatus,
            });

            // Update Student's Clearance Document
            const clearanceRef = doc(db, 'clearanceStatus', feeData.userId);
            transaction.update(clearanceRef, {
                [`blockingItems.${feeId}.pendingReview`]: false,
            });
            return clearanceRef.id;
        })

        await recalculateClearanceStatus(clearanceId);
    } catch (error) {
        console.error("Error rejecting payment:", error);
        throw error;
    }
}