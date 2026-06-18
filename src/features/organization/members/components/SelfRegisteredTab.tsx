"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Inbox,
  LayoutGrid,
  List,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SelfRegistration } from "../data/mockSelfRegistrations";
import { SelfRegDecision } from "../hooks/useSelfRegistrations";
import { SelfRegistrationDetailsModal } from "./SelfRegistrationDetailsModal";
import { SelfRegistrationCard } from "./SelfRegistrationCard";

export type SelfRegProcessing = {
  id: string;
  action: SelfRegDecision;
} | null;

interface SelfRegisteredTabProps {
  registrations: SelfRegistration[];
  processing: SelfRegProcessing;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

type SelfRegView = "grid" | "table";

const ITEMS_PER_PAGE = 9;

const formatYearLevel = (year: number) => {
  const suffix =
    year === 1 ? "st" : year === 2 ? "nd" : year === 3 ? "rd" : "th";
  return `${year}${suffix}`;
};

const formatSubmittedAt = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export function SelfRegisteredTab({
  registrations,
  processing,
  onAccept,
  onReject,
}: SelfRegisteredTabProps) {
  const [selected, setSelected] = useState<SelfRegistration | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<SelfRegView>("grid");
  const [page, setPage] = useState(1);

  const isAccepting = (id: string) =>
    processing?.id === id && processing.action === "accept";
  const isRejecting = (id: string) =>
    processing?.id === id && processing.action === "reject";
  const isRowBusy = (id: string) => processing?.id === id;

  const totalPages = Math.max(
    1,
    Math.ceil(registrations.length / ITEMS_PER_PAGE)
  );

  // Keep the current page in range as the list shrinks (accept/reject).
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return registrations.slice(start, start + ITEMS_PER_PAGE);
  }, [registrations, page]);

  const handleView = (registration: SelfRegistration) => {
    setSelected(registration);
    setIsModalOpen(true);
  };

  if (registrations.length === 0) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-12 text-center">
        <div className="max-w-sm mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-50 rounded-full flex items-center justify-center">
            <Inbox className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            All caught up!
          </h3>
          <p className="text-gray-500">
            There are no self-registered students waiting for verification right
            now.
          </p>
        </div>
      </div>
    );
  }

  const rangeStart = (page - 1) * ITEMS_PER_PAGE + 1;
  const rangeEnd = Math.min(page * ITEMS_PER_PAGE, registrations.length);

  return (
    <>
      {/* Info banner + view toggle */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <Badge
            variant="secondary"
            className="mt-0.5 bg-amber-100 text-amber-700"
          >
            {registrations.length} pending
          </Badge>
          <p className="text-sm text-amber-800">
            These freshmen self-registered and are awaiting verification. Review
            each application, then accept to add them as members or reject to
            dismiss.
          </p>
        </div>

        <div className="flex shrink-0 items-center self-start rounded-lg bg-gray-100 p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("grid")}
            className={`h-8 px-3 transition-all ${
              viewMode === "grid"
                ? "bg-gray-200 shadow-sm text-black"
                : "text-black hover:bg-green-100 hover:text-black"
            }`}
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            Grid
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("table")}
            className={`h-8 px-3 transition-all ${
              viewMode === "table"
                ? "bg-gray-200 shadow-sm text-black"
                : "text-black hover:bg-green-100 hover:text-black"
            }`}
          >
            <List className="h-4 w-4 mr-2" />
            Table
          </Button>
        </div>
      </div>

      {/* Grid view */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pageItems.map((reg) => (
            <SelfRegistrationCard
              key={reg.id}
              registration={reg}
              processing={processing}
              onView={handleView}
              onAccept={onAccept}
              onReject={onReject}
            />
          ))}
        </div>
      ) : (
        /* Table view */
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          {/* Mobile card layout */}
          <div className="block sm:hidden divide-y divide-gray-200">
            {pageItems.map((reg) => (
              <div key={reg.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">
                      {reg.firstName} {reg.lastName}
                    </h3>
                    <p className="text-xs text-gray-500 font-mono mt-1">
                      ID: {reg.studentId}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-amber-100 text-amber-700"
                  >
                    Pending
                  </Badge>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Program:</span>
                    <span className="text-gray-700 text-right">
                      {reg.programName} · {formatYearLevel(reg.yearLevel)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Submitted:</span>
                    <span className="text-gray-700">
                      {formatSubmittedAt(reg.submittedAt)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleView(reg)}
                    disabled={isRowBusy(reg.id)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View
                  </Button>
                  <LoadingButton
                    variant="success"
                    size="sm"
                    className="flex-1"
                    onClick={() => onAccept(reg.id)}
                    isLoading={isAccepting(reg.id)}
                    loadingText="Accepting…"
                    disabled={isRowBusy(reg.id)}
                  >
                    <Check className="h-3.5 w-3.5" />
                    Accept
                  </LoadingButton>
                  <LoadingButton
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={() => onReject(reg.id)}
                    isLoading={isRejecting(reg.id)}
                    loadingText="Rejecting…"
                    disabled={isRowBusy(reg.id)}
                  >
                    <X className="h-3.5 w-3.5" />
                    Reject
                  </LoadingButton>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop / tablet table layout */}
          <div className="hidden sm:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200 bg-gray-50">
                  <TableHead className="font-semibold text-gray-900 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-sm">
                    Name
                  </TableHead>
                  <TableHead className="font-semibold text-gray-900 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-sm">
                    Student ID
                  </TableHead>
                  <TableHead className="font-semibold text-gray-900 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-sm hidden md:table-cell">
                    Program
                  </TableHead>
                  <TableHead className="font-semibold text-gray-900 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-sm hidden lg:table-cell">
                    Year
                  </TableHead>
                  <TableHead className="font-semibold text-gray-900 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-sm hidden lg:table-cell">
                    Submitted
                  </TableHead>
                  <TableHead className="text-right font-semibold text-gray-900 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-sm">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((reg) => (
                  <TableRow
                    key={reg.id}
                    className="border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <TableCell className="font-medium text-gray-900 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-sm">
                      {reg.firstName} {reg.lastName}
                    </TableCell>
                    <TableCell className="text-gray-700 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-sm">
                      <span className="font-mono text-xs sm:text-sm">
                        {reg.studentId}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-700 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-sm hidden md:table-cell">
                      <span className="truncate max-w-[180px] lg:max-w-none block">
                        {reg.programName}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-700 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-sm hidden lg:table-cell">
                      {formatYearLevel(reg.yearLevel)}
                    </TableCell>
                    <TableCell className="text-gray-700 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-sm hidden lg:table-cell">
                      {formatSubmittedAt(reg.submittedAt)}
                    </TableCell>
                    <TableCell className="text-right px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(reg)}
                          disabled={isRowBusy(reg.id)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Button>
                        <LoadingButton
                          variant="success"
                          size="sm"
                          onClick={() => onAccept(reg.id)}
                          isLoading={isAccepting(reg.id)}
                          loadingText="Accepting…"
                          disabled={isRowBusy(reg.id)}
                        >
                          <Check className="h-3.5 w-3.5" />
                          Accept
                        </LoadingButton>
                        <LoadingButton
                          variant="destructive"
                          size="sm"
                          onClick={() => onReject(reg.id)}
                          isLoading={isRejecting(reg.id)}
                          loadingText="Rejecting…"
                          disabled={isRowBusy(reg.id)}
                        >
                          <X className="h-3.5 w-3.5" />
                          Reject
                        </LoadingButton>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Pagination — only when more than one page of registrations */}
      {registrations.length > ITEMS_PER_PAGE && (
        <div className="mt-4 flex items-center justify-between px-1">
          <p className="text-sm text-muted-foreground">
            Showing {rangeStart}–{rangeEnd} of {registrations.length} · Page{" "}
            {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      <SelfRegistrationDetailsModal
        registration={selected}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onAccept={onAccept}
        onReject={onReject}
      />
    </>
  );
}
