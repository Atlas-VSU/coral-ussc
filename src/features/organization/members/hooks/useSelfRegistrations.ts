"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import {
  MOCK_SELF_REGISTRATIONS,
  SelfRegistration,
} from "../data/mockSelfRegistrations";

export type SelfRegDecision = "accept" | "reject";

/**
 * Manages the list of self-registered students awaiting verification.
 */
export function useSelfRegistrations() {
  const [registrations, setRegistrations] = useState<SelfRegistration[]>(
    MOCK_SELF_REGISTRATIONS // delete this once real data fetching is implemented
  );
  const [processing, setProcessing] = useState<{
    id: string;
    action: SelfRegDecision;
  } | null>(null);

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
      await new Promise((resolve) => setTimeout(resolve, 700));

      setRegistrations((prev) => prev.filter((r) => r.id !== id));
      setProcessing(null);

      const name = `${target.firstName} ${target.lastName}`;
      if (action === "accept") {
        toast.success(`${name} accepted and added to members.`);
      } else {
        toast.info(`${name}'s registration was rejected.`);
      }
    },
    []
  );

  const accept = useCallback((id: string) => decide(id, "accept"), [decide]);
  const reject = useCallback((id: string) => decide(id, "reject"), [decide]);

  return {
    registrations,
    pendingCount: registrations.length,
    processing,
    accept,
    reject,
  };
}
