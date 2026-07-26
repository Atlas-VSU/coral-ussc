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
import { LoadingButton } from "@/components/ui/loading-button";
import { Badge } from "@/components/ui/badge";
import { Check, ExternalLink, FileText, ImageIcon, X } from "lucide-react";
import { useState } from "react";
import { SelfRegistration } from "../data/mockSelfRegistrations";

interface SelfRegistrationDetailsModalProps {
  registration: SelfRegistration | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: (id: string) => void | Promise<void>;
  onReject: (id: string) => void | Promise<void>;
}

const formatYearLevel = (year: number) => {
  const suffix =
    year === 1 ? "st" : year === 2 ? "nd" : year === 3 ? "rd" : "th";
  return `${year}${suffix} Year`;
};

const formatSubmittedAt = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b !border-[#2E7D32]/10 py-2.5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs font-semibold uppercase tracking-wide text-[#2E7D32]/70">
        {label}
      </span>
      <span className="text-sm font-medium text-black sm:text-right">
        {value}
      </span>
    </div>
  );
}

export function SelfRegistrationDetailsModal({
  registration,
  open,
  onOpenChange,
  onAccept,
  onReject,
}: SelfRegistrationDetailsModalProps) {
  const [pending, setPending] = useState<"accept" | "reject" | null>(null);

  if (!registration) return null;

  const handleAccept = async () => {
    if (pending) return;
    setPending("accept");
    try {
      await onAccept(registration.id);
      onOpenChange(false);
    } finally {
      setPending(null);
    }
  };

  const handleReject = async () => {
    if (pending) return;
    setPending("reject");
    try {
      await onReject(registration.id);
      onOpenChange(false);
    } finally {
      setPending(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white text-black border !border-[#2E7D32]/30">
        <DialogHeader className="border-b !border-[#2E7D32]/20 pb-3">
          <DialogTitle className="flex items-center gap-2 text-[#1B5E20]">
            Registration Details
            <Badge
              variant="secondary"
              className="bg-amber-100 text-amber-700"
            >
              Pending
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-[#2E7D32]/70">
            Review this freshman&apos;s self-registration before accepting or
            rejecting.
          </DialogDescription>
        </DialogHeader>

        <div className="py-1">
          <DetailRow
            label="Full Name"
            value={`${registration.firstName} ${registration.lastName}`}
          />
          <DetailRow label="Student ID" value={registration.studentId} />
          <DetailRow label="Email" value={registration.email} />
          <DetailRow label="Program" value={registration.programName} />
          <DetailRow
            label="Year Level"
            value={formatYearLevel(registration.yearLevel)}
          />
          <DetailRow
            label="Submitted"
            value={formatSubmittedAt(registration.submittedAt)}
          />

          {/* COR attachment */}
          <div className="mt-3 rounded-md border !border-[#2E7D32]/20 bg-[#8BC34A]/5 p-3">
            <span className="flex items-center gap-2 text-sm font-semibold text-[#1B5E20] mb-2">
              <FileText className="h-4 w-4" />
              Certificate of Registration
            </span>

            {registration.corURL ? (
              registration.corURL.toLowerCase().includes(".pdf") ? (
                // PDF — open in new tab
                <a
                  href={registration.corURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#8BC34A]/15 px-3 py-1.5 text-xs font-semibold text-[#1B5E20] hover:bg-[#8BC34A]/30 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View PDF
                </a>
              ) : (
                // Image — inline thumbnail + open link
                <div className="space-y-2">
                  <img
                    src={registration.corURL}
                    alt="Certificate of Registration"
                    className="max-h-48 w-full rounded-md border border-[#2E7D32]/20 object-contain bg-white"
                  />
                  <a
                    href={registration.corURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#2E7D32] hover:underline"
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    Open full image
                  </a>
                </div>
              )
            ) : (
              <p className="text-xs text-muted-foreground">
                No COR was uploaded with this registration.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <LoadingButton
            variant="destructive"
            type="button"
            onClick={handleReject}
            isLoading={pending === "reject"}
            loadingText="Rejecting…"
            disabled={pending !== null}
            className="sm:mr-auto"
          >
            <X className="h-4 w-4" />
            Reject
          </LoadingButton>
          <Button 
            variant="outline"
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={pending !== null}
          >
            Close
          </Button>
          <LoadingButton
            variant="success"
            type="button"
            onClick={handleAccept}
            isLoading={pending === "accept"}
            loadingText="Accepting…"
            disabled={pending !== null}
          >
            <Check className="h-4 w-4" />
            Accept
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
