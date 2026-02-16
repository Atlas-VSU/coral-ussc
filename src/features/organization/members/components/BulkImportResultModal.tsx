import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import React, { useEffect, useRef, useState } from "react";
import { BulkImportResult } from "../types";
import { SummaryCard } from "./SummaryCard";
import { exportErrorsToCSV } from "../utils";

interface BulkImportResultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: BulkImportResult | null;
}

export function BulkImportResultModal({
  open,
  onOpenChange,
  result,
}: BulkImportResultModalProps) {
  const [showErrors, setShowErrors] = useState(true);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open || !result) return null;

  const { errors, duplicates, successfulImports } = result;
  const errorCount = errors.length;
  const duplicateCount = duplicates.length;
  const successCount = successfulImports;

  const handleExportErrorsToCSV = () => {
    exportErrorsToCSV(errors);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
      onMouseDown={(e) => {
        // close when clicking the overlay (but not when clicking modal content)
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal container */}
      <div
        ref={containerRef}
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-lg shadow-lg z-10 m-7 mb-15"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-border/50">
          <div className="flex items-center gap-3 text-2xl">
            {result.success && errorCount === 0 ? (
              <CheckCircle2 className="h-7 w-7 text-green-500" />
            ) : (
              <XCircle className="h-7 w-7 text-red-500" />
            )}
            <h3 className="font-semibold">Import Complete</h3>
          </div>
          <p className="pt-1 text-base text-muted-foreground">
            The import process has finished. See the summary below for details.
          </p>
        </div>

        <div className="space-y-5 px-6 pb-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-4 mb-0">
            <SummaryCard
              icon={CheckCircle2}
              title="Success"
              value={successCount}
              description="Members imported"
              colorClass="border-green-500"
            />
            <SummaryCard
              icon={XCircle}
              title="Errors"
              value={errorCount}
              description="Rows failed to import"
              colorClass="border-red-500"
            />
            <SummaryCard
              icon={AlertCircle}
              title="Duplicates"
              value={duplicateCount}
              description="Existing members skipped"
              colorClass="border-yellow-500"
            />
          </div>

          {/* Error Details */}
          {errorCount > 0 && (
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-500" />
                    Import Errors ({errorCount})
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1"
                      onClick={handleExportErrorsToCSV}
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Export</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setShowErrors(!showErrors)}
                    >
                      {showErrors ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <CardDescription className="pt-1">
                  These rows could not be imported. Please correct them and try
                  again.
                </CardDescription>
              </CardHeader>
              {showErrors && (
                <CardContent className="pt-0">
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-20 px-3">Row #</TableHead>
                          <TableHead className="px-3">Student ID</TableHead>
                          <TableHead className="px-3">
                            Error Description
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {errors.map((error, index) => (
                          <TableRow
                            key={index}
                            className="hover:bg-slate-50 hover:text-black dark:hover:bg-slate-800 dark:hover:text-white"
                          >
                            <TableCell className="font-medium px-3 py-2.5">
                              {error.row}
                            </TableCell>
                            <TableCell className="px-3 py-2.5">
                              <Badge
                                variant="secondary"
                                className="max-w-[120px] truncate"
                              >
                                {error.studentId || "N/A"}
                              </Badge>
                            </TableCell>
                            {/* <TableCell className="text-red-600 px-3 py-2.5">
                              <div
                                className="max-w-[300px] truncate"
                                title={error.error}
                              >
                                {error.error}
                              </div>
                            </TableCell> */}
                            <TableCell className="text-red-600 px-3 py-2.5">
                              <TooltipProvider>
                                <UITooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      className="max-w-[380px] truncate cursor-help min-w-0"
                                      aria-label={error.error}
                                    >
                                      {error.error}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent
                                    side="top"
                                    align="center"
                                    className="max-w-sm"
                                  >
                                    <div className="text-sm whitespace-pre-wrap break-words">
                                      {error.error}
                                    </div>
                                  </TooltipContent>
                                </UITooltip>
                              </TooltipProvider>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Duplicate Details */}
          {duplicateCount > 0 && (
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                    Skipped Duplicates ({duplicateCount})
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setShowDuplicates(!showDuplicates)}
                  >
                    {showDuplicates ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <CardDescription className="pt-1">
                  These members already exist and were skipped to prevent
                  duplication.
                </CardDescription>
              </CardHeader>
              {showDuplicates && (
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto p-1">
                    {duplicates.map((studentId, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="max-w-[120px] truncate"
                        title={studentId}
                      >
                        {studentId}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 bg-slate-50 dark:bg-slate-800 p-4 px-6 border-t rounded-b-lg">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
