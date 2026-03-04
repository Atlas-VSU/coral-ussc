import { Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

export const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: any }> = {
  "pending_verification": {
    label: "Pending",
    variant: "secondary",
    icon: Clock,
  },
  "verified": {
    label: "Verified",
    variant: "default",
    icon: CheckCircle2,
  },
  "rejected": {
    label: "Rejected",
    variant: "destructive",
    icon: XCircle,
  },
  "unpaid": {
    label: "Unpaid",
    variant: "outline",
    icon: AlertCircle,
  },
};

export const paymentMethodLabels: Record<string, string> = {
  gcash: "GCash",
  cash: "Cash",
  bank_transfer: "Bank Transfer",
};