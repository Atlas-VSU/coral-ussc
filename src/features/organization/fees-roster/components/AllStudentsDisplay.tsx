// app/admin/fees/roster/components/AllStudentsDisplay.tsx
import { Eye, PenLine } from "lucide-react";
// import { Button } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { statusConfig } from "@/features/organization/fees/utils/statusConfig";
import type { PaymentLog } from "@/features/organization/fees/types";
import type { Member } from "@/features/organization/members/types";
import { PaymentStatus } from "@/constants/status";

export type Row = { student: Partial<Member>; log?: PaymentLog; status: string };

export function AllStudentsTable({
  rows,
  onViewDetails,
  onManualLog,
}: {
  rows: Row[];
  onViewDetails: (log: PaymentLog) => void;
  onManualLog: (student: Partial<Member>) => void;
}) {
  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student ID</TableHead>
            <TableHead>Full Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Amount Paid</TableHead>
            <TableHead>Paid At</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ student, log, status }, index) => {
            const config = log?.status ? statusConfig[log.status] : statusConfig["unpaid"];
            const Icon = config.icon;
            return (
              <TableRow key={`${student?.studentId || student?.id || "no-id"}-table-${index}`}>
                <TableCell className="text-xs font-mono text-muted-foreground">{student?.studentId || "—"}</TableCell>
                <TableCell className="text-sm font-medium text-foreground">
                  {student?.firstName || ""} {student?.lastName || ""}
                </TableCell>
                <TableCell>
                  <Badge variant={config.variant} className="flex items-center gap-1 w-fit text-xs">
                    <Icon className="size-3" /> {config.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {log && (log.status === PaymentStatus.VERIFIED || log.status === PaymentStatus.PENDING) ? `₱${(log.amount || 0).toLocaleString()}` : "—"}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                    {log?.paidAt && (log.status === PaymentStatus.VERIFIED || log.status === PaymentStatus.PENDING) ? (log.paidAt.toDate ? log.paidAt.toDate().toLocaleDateString() : log.paidAt.toString()) : "—"}
                </TableCell>
                <TableCell>
                  {log && (log.status === PaymentStatus.VERIFIED || log.status === PaymentStatus.PENDING) ? (
                    <Button size="sm" variant="outline" onClick={() => onViewDetails(log)}>
                      <Eye className="size-3 mr-1" /> View Details
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 border-green-500/40 text-green-500 hover:text-green-800 dark:border-green-500/30 dark:hover:bg-[#8ff558]"
                      onClick={() => onManualLog(student)}
                    >
                      <PenLine className="size-3" /> Log Payment
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export function AllStudentsCards({
  rows,
  onViewDetails,
  onManualLog,
}: {
  rows: Row[];
  onViewDetails: (log: PaymentLog) => void;
  onManualLog: (student: Partial<Member>) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map(({ student, log }, index) => {
        const config = log?.status ? statusConfig[log.status] : statusConfig["unpaid"];
        const Icon = config.icon;
        return (
          <Card key={`${student.studentId || student.id || "no-id"}-card-${index}`} className="border-border">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {student.firstName || ""} {student.lastName || ""}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground">{student.studentId || "—"}</p>
                </div>
                <Badge variant={config.variant} className="flex items-center gap-1 text-xs shrink-0">
                  <Icon className="size-3" /> {config.label}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">
                  {log && (log.status === PaymentStatus.VERIFIED || log.status === PaymentStatus.PENDING)  ? `₱${(log.amount || 0).toLocaleString()}` : "—"}
                </span>
                {log && (log.status === PaymentStatus.VERIFIED || log.status === PaymentStatus.PENDING) ? (
                  <Button size="sm" variant="outline" onClick={() => onViewDetails(log)}>
                    <Eye className="size-3 mr-1" /> View Details
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 border-green-500/40 !text-green-700 hover:bg-[#7aea55] hover:text-green-800 dark:hover:hover:bg-[#7aea55]"
                    onClick={() => onManualLog(student)}
                  >
                    <PenLine className="size-3" /> Log Payment
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}