"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, User, GraduationCap, IdCard } from "lucide-react";
import { ResponsiveProgramText } from "./ResponsiveProgramText";

interface StudentData {
  name: string;
  studentId: string;
  program: string;
  programShortName?: string;
  programAcronym?: string;
}

interface ConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  studentData: StudentData;
}

export function ConfirmationModal({
  open,
  onClose,
  onConfirm,
  studentData,
}: ConfirmationModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-2">
            <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <DialogTitle className="text-center">Confirm Your Information</DialogTitle>
          <DialogDescription className="text-center">
            Please verify that the following details are correct
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Full Name */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">Full Name</p>
              <p className="text-sm font-medium text-foreground">
                {studentData.name}
              </p>
            </div>
          </div>

          {/* Student ID */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <IdCard className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">Student ID</p>
              <p className="text-sm font-medium text-foreground font-mono">
                {studentData.studentId}
              </p>
            </div>
          </div>

          {/* Program */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">Program</p>
              <p className="text-sm font-medium text-foreground">
                <ResponsiveProgramText
                  fullName={studentData.program}
                  shortName={studentData.programShortName}
                  acronym={studentData.programAcronym}
                />
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
          >
            Confirm & Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
