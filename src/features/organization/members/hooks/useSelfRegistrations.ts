"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  MOCK_SELF_REGISTRATIONS,
  SelfRegistration,
} from "../data/mockSelfRegistrations";
import { assignExistingFeesToStudent, buildClearanceId, getCurrentUser, getCurrentUserData, getPendingMembersOfAnOrg, getUserById, updateMemberStatus } from "@/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useTermPeriod } from "../../term/hooks/useTermPeriod";
import { Term } from "@/constants/types";
import { Member } from "../types";
import { getAllOrgs, getOrgById } from "@/firebase/organization";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/firebase/firebase.config";
import { ClearanceStatus } from "../../clearance/types";
import { assignExistingFinesToStudent } from "@/firebase/fines/create/fines";
import { getActiveTerm } from "@/firebase/term";

export type SelfRegDecision = "approved" | "reject";

/**
 * Manages the list of self-registered students awaiting verification.
 */
export function useSelfRegistrations() {
  const [registrations, setRegistrations] = useState<SelfRegistration[]>([]);
  const [processing, setProcessing] = useState<{
    id: string;
    action: SelfRegDecision;
  } | null>(null);
  const [userData, setUserData] = useState<Member | null>(null);

  useEffect(() => {
    const fetchPendingMembers = async () => {
      const currentUserData = await getCurrentUserData()
      const pendingMembers = await getPendingMembersOfAnOrg(currentUserData!);
      setRegistrations(pendingMembers);
      setUserData(currentUserData);
    };
    fetchPendingMembers();
    
    console.log(registrations)
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
      // Simulate the verification request so the button feedback is visible.
      
      if(action == "approved") {
        await updateMemberStatus(id, action)
        const active = await getActiveTerm();
        const user = await getUserById(id);
        const orgs = await getAllOrgs();
        for (const org of orgs) {
          if(org.subscribed && org.programId == user?.programId || org.facultyId == user?.facultyId || (org.facultyId == null && org.programId == null) ) {
            const clearanceId = buildClearanceId(id!, org?.id!, org?.accessLevel!, active! as Term)
            const clearanceRef = doc(db, 'clearanceStatus', clearanceId);
            const now = Timestamp.now(); 
            const defaultDueDate = Timestamp.fromDate(new Date('2026-12-30'));

            const clearanceData: ClearanceStatus = {
                    id: clearanceId,
                    orgId: org?.id!, 
                    userId: id,
                    userName: `${user?.firstName} ${user?.lastName}`,
                    studentId: user?.studentId || "N/A", // Fallback just in case
                    academicYear: active!.AY,
                    semester: active!.semester,
                    status: 'cleared', 
                    visibility: 'public', 
                    blockingItems: {}, 
                    clearanceDate: null,
                    lastCalculatedAt: now,
                    startDate: now,
                    dueDate: defaultDueDate,
                    createdAt: now,
                    updatedAt: now,
                    isArchived: false
                  };
            
            await setDoc(clearanceRef, clearanceData);
            await assignExistingFeesToStudent(id, {firstName: user?.firstName || "", lastName: user?.lastName || "", studentId: user?.studentId || ""}, {uid: org?.id!, accessLevel: org?.accessLevel!}, userData!)
            await assignExistingFinesToStudent(id, {firstName: user?.firstName || "", lastName: user?.lastName || "", studentId: user?.studentId || ""}, {uid: org?.id!, accessLevel: org?.accessLevel!}, userData!)
          }
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
    []
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
