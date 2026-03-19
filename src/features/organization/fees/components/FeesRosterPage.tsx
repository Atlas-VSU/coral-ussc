"use client";

import { useFeesRoster } from "../hooks/useFeesRoster";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { FeesRosterContent } from "./FeesRosterContent";
import { useFeeAction } from "../hooks/useFeeAction";
import PaymentReceiptDialog from "../local-components/PaymentReceiptDialog";

interface FeesRosterPageProps {
  title: string;
  academicYear: string;
}

export default function FeesRosterPage({
  title,
  academicYear,
}: FeesRosterPageProps) {
  const { fee, studentRows, isLoading, error, refetchStudentRow, refetch } = useFeesRoster(title, academicYear);
  const { approvePayment, rejectPayment, addManualPayment, receiptData, receiptOpen, setReceiptOpen, archiveFee, isSubmitting } = useFeeAction(refetchStudentRow);

  if (isLoading && !fee) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="grid gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !fee) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error?.message || "Fee not found. Please check the title and academic year."}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
    { receiptOpen && (
      <PaymentReceiptDialog
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        data={receiptData}
      />
    )}
     
    <FeesRosterContent 
      fee={fee as any} 
      studentRows={studentRows} 
      onApprovePayment={approvePayment} 
      onManualPaymentAdded={addManualPayment} 
      onRejectPayment={rejectPayment} 
      onArchiveFee={archiveFee}
      isSubmitting={isSubmitting}
      refetchStudentRow={refetchStudentRow}
      isLoading={isLoading}
      refetch={refetch}
    />
    </>
  );
}
