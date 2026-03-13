import { useCallback, useEffect, useMemo, useState } from "react";
import { ProofOfPayment, StudentFines } from "../../fines/types";
import { getCurrentUserData, getUserById } from "@/firebase";
import { getAllProofOfPayments } from "@/firebase/payment/read/proofOfPayment";
import { toast } from "sonner";
import { fetchUnpaidFeesForOrg } from "@/firebase/fees";
import { getAllUnpaidFinesforOrg } from "@/firebase/fines/read/fines";
import { Fee } from "../../fees/types";
import { StudentUnpaidRecord, UnpaidDue } from "../types";

export function usePayments() {
  const [payments, setPayments] = useState<ProofOfPayment[]>([]);
  const [unpaidPayments, setUnpaidPayments] = useState<StudentUnpaidRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ── Fetch proof of payments ───────────────────────────────────────────────
  const loadPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentUser = await getCurrentUserData();
      if (!currentUser) throw new Error("Not Authenticated!");
      const data = await getAllProofOfPayments(currentUser.uid);
      setPayments(data.sort((a, b) => b.submittedAt.toMillis() - a.submittedAt.toMillis()));
    } catch (error) {
      toast.error("Could not load payments at this time.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Fetch unpaid fees + fines, then merge by student ─────────────────────
  const loadUnpaidPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fees, fines] = await Promise.all([
        fetchUnpaidFeesForOrg(),
        getAllUnpaidFinesforOrg(),
      ]);

      // Build lookup maps to avoid repeated .find() calls
      const feesByUserId = fees.reduce<Record<string, Fee[]>>((acc, fee) => {
        (acc[fee.userId] ??= []).push(fee);
        return acc;
      }, {});

      const finesByUserId = fines.reduce<Record<string, StudentFines>>((acc, fine) => {
        acc[fine.userId] = fine;
        return acc;
      }, {});

      // Unique student IDs across both
      const allUserIds = Array.from(new Set([
        ...fees.map(f => f.userId),
        ...fines.map(f => f.userId),
      ]));

      // Fetch all users in parallel
      const users = await Promise.all(allUserIds.map(id => getUserById(id)));

      const finalData: StudentUnpaidRecord[] = allUserIds
        .map((id, index) => {
          const student = users[index];
          if (!student) return null;

          const dues: UnpaidDue[] = [
            ...(feesByUserId[id] ?? []).map(fee => ({
              id: fee.id,
              type: "fee" as const,
              name: fee.title,
              item: fee,
            })),
            ...(finesByUserId[id]
              ? [{
                  id: finesByUserId[id].id!,
                  type: "fine" as const,
                  name: `${finesByUserId[id].semester} Fines`,
                  item: finesByUserId[id],
                }]
              : []),
          ];

          return { student, dues };
        })
        .filter(Boolean) as StudentUnpaidRecord[];

      setUnpaidPayments(finalData);
    } catch (error) {
      toast.error("Could not load unpaid payments.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
    loadUnpaidPayments();
  }, [loadPayments, loadUnpaidPayments]);

  // ── Derived lists (memoized so consumers don't recompute) ─────────────────
  const pendingPayments  = useMemo(() => payments.filter(p => p.status === "pending"),  [payments]);
  const rejectedPayments = useMemo(() => payments.filter(p => p.status === "rejected"), [payments]);
  const verifiedPayments = useMemo(() => payments.filter(p => p.status === "verified"), [payments]);

  return {
    payments,
    unpaidPayments,
    pendingPayments,
    rejectedPayments,
    verifiedPayments,
    refetchPayments: loadPayments,
    isLoading,
  };
}
