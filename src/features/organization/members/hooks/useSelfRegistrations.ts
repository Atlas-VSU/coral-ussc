"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { SelfRegistration } from "../data/mockSelfRegistrations";
import {
  getCurrentUserData,
  getUserById,
  updateMemberStatus,
} from "@/firebase";
import { subscribeToPendingMembers } from "@/firebase/members";
import { Member } from "../types";
import { getAllOrgs } from "@/firebase/organization";
import { onboardNewStudent } from "@/firebase/onboarding";
import { findArchivedRecordForStudentId } from "@/firebase/users";
import { useSendRegistrationStatus } from "@/features/organization/members/hooks/useSendRegistrationStatus";

export type SelfRegDecision = "approved" | "reject";

/**
 * Manages the list of self-registered students awaiting verification.
 *
 * Uses a Firestore real-time listener (onSnapshot) instead of a one-shot
 * getDocs fetch so that all admins on all devices see live updates instantly.
 * Cache is intentionally bypassed for this hook.
 */
export function useSelfRegistrations() {
  const [registrations, setRegistrations] = useState<SelfRegistration[]>([]);
  const [processing, setProcessing] = useState<{
    id: string;
    action: SelfRegDecision;
  } | null>(null);
  const [userData, setUserData] = useState<Member | null>(null);
  const { sendRegistrationStatus } = useSendRegistrationStatus();

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const start = async () => {
      const currentUserData = await getCurrentUserData();
      if (!currentUserData) return;

      setUserData(currentUserData as unknown as Member);

      // subscribeToPendingMembers returns the Firestore unsubscribe fn.
      // The callback fires immediately (current snapshot) then on every change.
      unsubscribe = await subscribeToPendingMembers(
        currentUserData as unknown as Member,
        (members) => setRegistrations(members)
      );
    };

    start();

    // Cleanup: detach the Firestore listener when the component unmounts.
    return () => {
      unsubscribe?.();
    };
  }, []);

  // Mirror the latest list / in-flight flag in refs so the callbacks can read
  // them without going stale, and so side effects (toasts) live OUTSIDE the
  // state updater (React Strict Mode invokes updaters twice in dev, which would
  // otherwise fire the toast twice).
  const registrationsRef = useRef(registrations);
  registrationsRef.current = registrations;
  const processingRef = useRef(processing);
  processingRef.current = processing;

  const decide = useCallback(
    async (id: string, action: SelfRegDecision) => {
      // Ignore if a decision is already in flight (guards double-clicks).
      if (processingRef.current) return;
      const target = registrationsRef.current.find((r) => r.id === id);
      if (!target) return;

      setProcessing({ id, action });

      // Send registration status email to the user first before updating status or deleting
      const statusToSend = action === "approved" ? "approved" : "rejected";
      if (target.email) {
        await sendRegistrationStatus(target.email, statusToSend);
      }

      if (action == "approved") {
        const user = await getUserById(id);

        // An older retired record may hold this same Student ID — typically one
        // the roster sync removed. Approving would leave a permanent duplicate
        // pair: the student's fees, fines and clearance stranded on the retired
        // document while onboarding creates a fresh set here. Resolving that
        // means choosing which record survives, so it is referred to an
        // operator rather than decided automatically.
        const archivedDuplicate = user?.studentId
          ? await findArchivedRecordForStudentId(user.studentId, id)
          : null;

        if (archivedDuplicate) {
          setProcessing(null);
          toast.error(
            `${target.firstName} ${target.lastName} already has a retired record ` +
            `(${user!.studentId}). Restore it from the Members list instead of approving this ` +
            `registration — approving would duplicate the student and their charges.`,
            { duration: 10000 }
          );
          return;
        }

        await updateMemberStatus(id, action)
        const orgs = await getAllOrgs();
        if (user) {
          await onboardNewStudent(id, user as Member, orgs, userData as Member);
        }
      }
      else {
        await updateMemberStatus(id, action)
      }

      setRegistrations((prev) => prev.filter((r) => r.id !== id));
      setProcessing(null);

      const name = `${target.firstName} ${target.lastName}`;
      if (action === "approved") {
        toast.success(`${name} accepted and added to members.`);
      } else {
        toast.info(`${name}'s registration was rejected.`);
      }
    },
    [sendRegistrationStatus]
  );

  const accept = useCallback((id: string) => decide(id, "approved"), [decide]);
  const reject = useCallback((id: string) => decide(id, "reject"), [decide]);

  return {
    registrations,
    pendingCount: registrations.length,
    processing,
    accept,
    reject,
  };
}
