"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Member } from "@/features/organization/members/types";
import type { StudentIdentityResolution } from "@/firebase/users";
import {
  describeRestoreResult,
  restoreArchivedStudent,
  type RestoreResult,
} from "@/firebase/restore";

/** The archived record an onboarding attempt collided with. */
export type ArchivedMatch = Extract<
  StudentIdentityResolution,
  { status: "archived" }
>;

export interface PendingRestore {
  /** What `resolveStudentIdentity` found behind the Student ID. */
  resolution: ArchivedMatch;
  /** The student the operator was trying to create, used to refresh the
   *  restored record's roster fields. */
  student: Member;
}

interface UseStudentRestoreOptions {
  /** Called after a successful restore, before the prompt is cleared. */
  onRestored?: (student: Member, result: RestoreResult) => void;
}

/**
 * The shared "this student is archived — restore instead of duplicating" flow.
 *
 * Every surface that creates students runs the same three steps: resolve the
 * Student ID, prompt when it belongs to a retired record, then restore. Those
 * steps were written out separately per surface, and diverged — Members
 * reported what came back and warned about records it could not reinstate,
 * Log Attendance discarded the result entirely and told the operator a student
 * had been "added". Owning the state machine and the reporting here means a
 * new entry point gets the whole behaviour by using the hook, rather than by
 * remembering to reimplement it.
 *
 * Success and partial-restore reporting is handled here so it reads the same
 * everywhere. `error` is returned rather than toasted, so each surface can put
 * it where the failed action is — inline in a form, or beside the prompt.
 */
export function useStudentRestore({ onRestored }: UseStudentRestoreOptions = {}) {
  const [pending, setPending] = useState<PendingRestore | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Offer a restore for the archived record this student collided with. */
  const promptRestore = useCallback(
    (resolution: ArchivedMatch, student: Member) => {
      setError(null);
      setPending({ resolution, student });
    },
    []
  );

  const dismissRestore = useCallback(() => {
    setError(null);
    setPending(null);
  }, []);

  /**
   * Runs the restore. Resolves `true` when the record came back, so callers
   * can close their dialog only on success and leave it open — with the reason
   * shown — when the restore was refused.
   */
  const confirmRestore = useCallback(async (): Promise<boolean> => {
    if (!pending) return false;

    setIsRestoring(true);
    setError(null);
    try {
      const result = await restoreArchivedStudent(
        pending.resolution.docId,
        pending.student
      );

      const { summary, warning } = describeRestoreResult(result);
      toast.success(summary);
      if (warning) toast.warning(warning);

      onRestored?.(pending.student, result);
      setPending(null);
      return true;
    } catch (err) {
      // Restore refuses rather than guesses — an email that now belongs to an
      // active student, a record that has since gone, no active term. Keep the
      // prompt open and say which.
      console.error("Failed to restore student record:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to restore this record. Please try again."
      );
      return false;
    } finally {
      setIsRestoring(false);
    }
  }, [pending, onRestored]);

  return {
    /** Non-null while a restore is being offered. */
    pending,
    isRestoring,
    /** Why the last restore attempt was refused, if it was. */
    error,
    promptRestore,
    dismissRestore,
    confirmRestore,
  };
}
