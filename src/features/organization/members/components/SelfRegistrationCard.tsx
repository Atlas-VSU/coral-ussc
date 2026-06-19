"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CalendarClock, Check, Eye, GraduationCap, Mail, X } from "lucide-react";
import { SelfRegistration } from "../data/mockSelfRegistrations";
import { SelfRegProcessing } from "./SelfRegisteredTab";

interface SelfRegistrationCardProps {
  registration: SelfRegistration;
  processing: SelfRegProcessing;
  onView: (registration: SelfRegistration) => void;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

const getInitials = (firstName: string, lastName: string) =>
  `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

const formatYearLevel = (year: number) => {
  const suffix =
    year === 1 ? "st" : year === 2 ? "nd" : year === 3 ? "rd" : "th";
  return `${year}${suffix} Year`;
};

const formatSubmittedAt = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export function SelfRegistrationCard({
  registration,
  processing,
  onView,
  onAccept,
  onReject,
}: SelfRegistrationCardProps) {
  const isAccepting =
    processing?.id === registration.id && processing.action === "approved";
  const isRejecting =
    processing?.id === registration.id && processing.action === "reject";
  const isBusy = processing?.id === registration.id;

  return (
    <Card className="group flex flex-col overflow-hidden border border-gray-200 bg-white transition-all duration-200 hover:border-gray-300 hover:shadow-md">
      <CardContent className="flex flex-grow flex-col gap-4 p-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Avatar className="h-11 w-11 shrink-0 border border-gray-200">
            <AvatarFallback className="bg-linear-to-r from-[#b8d390] via-[#51a555] to-[#225825] text-sm font-semibold text-white">
              {getInitials(registration.firstName, registration.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="truncate font-semibold leading-tight text-gray-900">
                {registration.firstName} {registration.lastName}
              </h3>
              <Badge
                variant="secondary"
                className="shrink-0 bg-amber-100 text-amber-700"
              >
                Pending
              </Badge>
            </div>
            <p className="mt-1 font-mono text-xs text-gray-500">
              {registration.studentId}
            </p>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 border-t border-gray-100 pt-3 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <GraduationCap className="h-4 w-4 shrink-0 text-gray-400" />
            <span className="truncate">{registration.programName}</span>
            <span className="shrink-0 text-gray-300">•</span>
            <span className="shrink-0 text-gray-500">
              {formatYearLevel(registration.yearLevel)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Mail className="h-4 w-4 shrink-0 text-gray-400" />
            <span className="truncate">{registration.email}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <CalendarClock className="h-4 w-4 shrink-0 text-gray-400" />
            <span>Submitted {formatSubmittedAt(registration.submittedAt)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-auto flex items-center gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onView(registration)}
            disabled={isBusy}
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </Button>
          <LoadingButton
            variant="success"
            size="sm"
            className="flex-1"
            onClick={() => onAccept(registration.id)}
            isLoading={isAccepting}
            loadingText="Accepting…"
            disabled={isBusy}
          >
            <Check className="h-3.5 w-3.5" />
            Accept
          </LoadingButton>
          <LoadingButton
            variant="destructive"
            size="sm"
            className="flex-1"
            onClick={() => onReject(registration.id)}
            isLoading={isRejecting}
            loadingText="Rejecting…"
            disabled={isBusy}
          >
            <X className="h-3.5 w-3.5" />
            Reject
          </LoadingButton>
        </div>
      </CardContent>
    </Card>
  );
}
