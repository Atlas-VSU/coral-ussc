/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CreditCard } from "lucide-react";
import Link from "next/link";

// Matches the proofOfPayments Firestore document shape
export interface DashboardPayment {
  id: string;
  userName: string;
  studentId: string;
  amount: number;
  status: string;           // "pending" | "verified" | "rejected"
  paymentMethod: string;    // "cash" | "gcash"
  paymentType: string;      // "fines" | "fees" | "bulk"
  receiptCode: string;
  referenceNumber: string;
  submittedAt: any;         // Firestore Timestamp
  items: Array<{
    title: string;
    amount: number;
    paymentType: string;
  }>;
}

interface RecentPaymentsProps {
  isLoading?: boolean;
  payments: DashboardPayment[];
}

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function formatDate(value: any): string {
  if (!value) return "—";
  const d = typeof value?.toDate === "function" ? value.toDate() : new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "verified":
      return <Badge className="text-xs bg-[#C8E6C9] text-[#1B5E20] border-[#A5D6A7]">Verified</Badge>;
    case "pending":
      return <Badge variant="outline" className="text-xs text-yellow-700 border-yellow-400 bg-yellow-50">Pending</Badge>;
    case "rejected":
      return <Badge variant="destructive" className="text-xs">Rejected</Badge>;
    default:
      return <Badge variant="secondary" className="text-xs capitalize">{status}</Badge>;
  }
}

const PaymentSkeletons = () => (
  <>
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-5 w-16" />
        </div>
      </div>
    ))}
  </>
);

export function RecentPayments({ isLoading = false, payments }: RecentPaymentsProps) {
  return (
    <Card className="border-border bg-card gap-0">
      <CardHeader className="px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
            <CreditCard className="size-4 text-primary" />
            Recent Transactions
          </div>
          <Button asChild variant="outline" size="sm" className="text-xs h-7">
            <Link href="/org-payments">View All</Link>
          </Button>
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Latest payment submissions
        </CardDescription>
      </CardHeader>

      <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
        <div className="flex flex-col gap-2">
          {isLoading ? (
            <PaymentSkeletons />
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <CreditCard className="h-8 w-8 mb-3 opacity-40" />
              <p className="text-sm font-medium">No transactions yet</p>
              <p className="text-xs mt-1">Payment submissions will appear here</p>
            </div>
          ) : (
            payments.map((payment) => {
              // Build a readable description from items if available
              const itemSummary =
                payment.items.length === 1
                  ? payment.items[0].title
                  : payment.items.length > 1
                  ? `${payment.items[0].title} +${payment.items.length - 1} more`
                  : payment.paymentType;

              return (
                <div
                  key={payment.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2.5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar className="size-8 shrink-0">
                      <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                        {getInitials(payment.userName || payment.studentId)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {payment.userName || payment.studentId || "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {payment.receiptCode} · {itemSummary} · {formatDate(payment.submittedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-semibold text-foreground">
                      ₱{payment.amount.toLocaleString()}
                    </span>
                    <StatusBadge status={payment.status} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}