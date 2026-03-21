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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";
import { BulkImportResult } from "../types";
import { exportErrorsToCSV } from "../utils";

interface BulkImportResultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: BulkImportResult | null;
}

const variantStyles = {
  success: {
    border: "border-[#2E7D32]/30",
    iconBg: "bg-[#8BC34A]/10",
    iconColor: "text-[#1B5E20]",
    valueColor: "text-[#1B5E20]",
  },
  error: {
    border: "border-red-300/60",
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
    valueColor: "text-red-600",
  },
  warning: {
    border: "border-yellow-300/60",
    iconBg: "bg-yellow-50",
    iconColor: "text-yellow-600",
    valueColor: "text-yellow-600",
  },
};

function SummaryCard({
  icon: Icon,
  title,
  value,
  description,
  variant,
}: {
  icon: React.ElementType;
  title: string;
  value: number;
  description: string;
  variant: "success" | "error" | "warning";
}) {
  const s = variantStyles[variant];
  return (
    <Card className={`bg-white border ${s.border} shadow-sm min-w-0`}>
      <CardContent className="p-2 sm:p-3 flex flex-col gap-1.5 min-w-0">
        <div className="flex items-center gap-1.5">
          <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${s.iconBg}`}>
            <Icon className={`w-3 h-3 ${s.iconColor}`} />
          </div>
          <span className={`text-xs font-bold truncate ${s.iconColor}`}>{title}</span>
        </div>
        <div className={`text-2xl font-extrabold leading-none ${s.valueColor}`}>
          {value.toLocaleString()}
        </div>
        <p className="text-xs text-[#2E7D32]/60 leading-tight">{description}</p>
      </CardContent>
    </Card>
  );
}

export function BulkImportResultModal({
  open,
  onOpenChange,
  result,
}: BulkImportResultModalProps) {
  const [showErrors, setShowErrors] = useState(true);
  const [showDuplicates, setShowDuplicates] = useState(false);

  if (!result) return null;

  const { errors, duplicates, successfulImports } = result;
  const errorCount = errors.length;
  const duplicateCount = duplicates.length;
  const successCount = successfulImports;
  const allGood = result.success && errorCount === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] max-w-2xl max-h-[90svh] overflow-y-auto py-6 px-4 sm:px-5 bg-white text-black border border-[#2E7D32]/30 shadow-lg">
        <DialogHeader className="border-b border-[#2E7D32]/20 pb-3">
          <DialogTitle className="flex items-center gap-2 text-[#1B5E20]">
            {allGood
              ? <CheckCircle2 className="h-5 w-5 text-[#1B5E20] shrink-0" />
              : <XCircle className="h-5 w-5 text-red-600 shrink-0" />
            }
            Import Complete
          </DialogTitle>
          <DialogDescription className="text-[#2E7D32]/70">
            The import process has finished. See the summary below for details.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 min-w-0">
            <SummaryCard icon={CheckCircle2} title="Success" value={successCount} description="Members imported" variant="success" />
            <SummaryCard icon={XCircle} title="Errors" value={errorCount} description="Rows failed to import" variant="error" />
            <SummaryCard icon={AlertCircle} title="Duplicates" value={duplicateCount} description="Existing members skipped" variant="warning" />
          </div>

          {/* Error Details */}
          {errorCount > 0 && (
            <Card className="bg-white border border-[#2E7D32]/30 shadow-sm overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-[#1B5E20]">
                    <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                    Import Errors ({errorCount})
                  </CardTitle>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 gap-1 bg-white border-[#2E7D32]/30 text-[#1B5E20] hover:bg-[#8BC34A]/10 text-xs"
                      onClick={() => exportErrorsToCSV(errors)}
                    >
                      <Download className="h-3 w-3" />
                      Export
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-[#1B5E20] hover:bg-[#8BC34A]/10"
                      onClick={() => setShowErrors(!showErrors)}
                    >
                      {showErrors ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <CardDescription className="text-[#2E7D32]/70 text-xs">
                  These rows could not be imported. Please correct them and try again.
                </CardDescription>
              </CardHeader>
              {showErrors && (
                <CardContent className="pt-0">
                  <div className="rounded-md border border-[#2E7D32]/20 overflow-hidden">
                    <Table className="w-full table-fixed">
                      <colgroup>
                        <col style={{ width: "52px" }} />
                        <col style={{ width: "96px" }} />
                        <col />
                      </colgroup>
                      <TableHeader>
                        <TableRow className="bg-[#8BC34A]/5 border-b border-[#2E7D32]/20 hover:bg-[#8BC34A]/5">
                          <TableHead className="px-2 py-2 text-[#1B5E20] font-semibold text-xs">Row #</TableHead>
                          <TableHead className="px-2 py-2 text-[#1B5E20] font-semibold text-xs">Student ID</TableHead>
                          <TableHead className="px-2 py-2 text-[#1B5E20] font-semibold text-xs">Error</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {errors.map((error, index) => (
                          <TableRow key={index} className="border-b border-[#2E7D32]/10 hover:bg-[#8BC34A]/5">
                            <TableCell className="px-2 py-2 text-xs font-medium text-black align-top">
                              {error.row}
                            </TableCell>
                            <TableCell className="px-2 py-2 align-top">
                              <Badge className="bg-[#8BC34A]/10 text-[#1B5E20] border-[#2E7D32]/20 text-xs block truncate w-full">
                                {error.studentId || "N/A"}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-2 py-2 text-xs text-red-600 align-top">
                              <TooltipProvider delayDuration={300}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="block truncate cursor-help">
                                      {error.error}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" align="start" className="max-w-xs break-words">
                                    {error.error}
                                  </TooltipContent>
                                </Tooltip>
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
            <Card className="bg-white border border-[#2E7D32]/30 shadow-sm overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-[#1B5E20] min-w-0">
                    <AlertCircle className="h-4 w-4 text-yellow-600 shrink-0" />
                    <span className="truncate">Skipped Duplicates ({duplicateCount})</span>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-[#1B5E20] hover:bg-[#8BC34A]/10 shrink-0"
                    onClick={() => setShowDuplicates(!showDuplicates)}
                  >
                    {showDuplicates ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
                <CardDescription className="text-[#2E7D32]/70 text-xs">
                  These members already exist and were skipped to prevent duplication.
                </CardDescription>
              </CardHeader>
              {showDuplicates && (
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                    {duplicates.map((studentId, index) => (
                      <Badge
                        key={index}
                        className="bg-[#8BC34A]/10 text-[#1B5E20] border-[#2E7D32]/20 text-xs max-w-[140px] truncate"
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

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-white border-[#2E7D32]/30 text-[#1B5E20] hover:bg-[#8BC34A]/10 hover:text-[#1B5E20]"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}