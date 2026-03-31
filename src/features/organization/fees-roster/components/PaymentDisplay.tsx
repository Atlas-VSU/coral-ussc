// app/admin/fees/roster/components/PaymentDisplay.tsx
import { CheckCircle2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { statusConfig } from "@/features/organization/fees/utils/statusConfig";
import type { PaymentLog } from "@/features/organization/fees/types";

export function PaymentTable({ logs, onViewDetails }: { logs: PaymentLog[]; onViewDetails: (log: PaymentLog) => void }) {
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
          {logs.map((log) => {
            const config = statusConfig[log?.status] || { label: log?.status || "Unknown", variant: "default" };
            const Icon = config?.icon ?? CheckCircle2;
            return (
              <TableRow key={log.id}>
                <TableCell className="text-xs font-mono text-muted-foreground">{(log as any).studentId}</TableCell>
                <TableCell className="text-sm font-medium text-foreground">{(log as any).studentName}</TableCell>
                <TableCell>
                  <Badge variant={config.variant} className="flex items-center gap-1 w-fit text-xs">
                    <Icon className="size-3" /> {config.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm font-medium">₱{log.amount.toLocaleString()}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                    {log.paidAt ? (log.paidAt.toDate ? log.paidAt.toDate().toLocaleDateString() : log.paidAt.toString()) : "—"}
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => onViewDetails(log)}>
                    <Eye className="size-3 mr-1" /> View Details
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
          {logs.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                No payment submissions found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export function PaymentCards({ logs, onViewDetails }: { logs: PaymentLog[]; onViewDetails: (log: PaymentLog) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {logs.map((log) => {
        const config = statusConfig[log?.status] || { label: log?.status || "Unknown", variant: "default" };
        const Icon = config?.icon ?? CheckCircle2;
        return (
          <Card key={log.id} className="border-border">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{(log as any).studentName}</p>
                  <p className="text-xs font-mono text-muted-foreground">{(log as any).studentId}</p>
                </div>
                <Badge variant={config.variant} className="flex items-center gap-1 text-xs shrink-0">
                  <Icon className="size-3" /> {config.label}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">₱{log.amount.toLocaleString()}</span>
                <Button size="sm" variant="outline" onClick={() => onViewDetails(log)}>
                  <Eye className="size-3 mr-1" /> View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
      {logs.length === 0 && (
        <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-muted-foreground">No payment submissions found</p>
        </div>
      )}
    </div>
  );
}