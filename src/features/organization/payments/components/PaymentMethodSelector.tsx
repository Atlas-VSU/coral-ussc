
import { cn } from "@/lib/utils";
import { OnlinePaymentMethod } from "../types";

const PAYMENT_METHODS = [
  { value: "gcash",         label: "GCash", icon: "📱", description: "Mobile wallet" },
  { value: "bank_transfer", label: "Bank",  icon: "🏦", description: "Wire transfer" },
] as const;

interface PaymentMethodSelectorProps {
  value: string;
  error?: string;
  onSelect: (value: OnlinePaymentMethod) => void;
}

export function PaymentMethodSelector({ value, error, onSelect }: PaymentMethodSelectorProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-3">
        {PAYMENT_METHODS.map(method => (
          <button
            key={method.value}
            type="button"
            onClick={() => onSelect(method.value)}
            className={cn(
              "flex flex-1 flex-col items-center gap-1.5 rounded-lg border-2 px-3 py-3 text-center transition-all cursor-pointer",
              value === method.value
                ? "border-green-500 bg-green-50 dark:bg-green-950/40 dark:border-green-500"
                : "border-border bg-card hover:border-green-300 hover:bg-green-50/50 dark:hover:bg-green-950/20"
            )}
          >
            <span className="text-xl">{method.icon}</span>
            <span className={cn(
              "text-xs font-700",
              value === method.value
                ? "text-green-700 dark:text-green-400 font-bold"
                : "text-foreground font-semibold"
            )}>
              {method.label}
            </span>
            <span className="text-[10px] text-muted-foreground">{method.description}</span>
          </button>
        ))}
      </div>
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1.5 mt-0.5">
          <span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">!</span>
          {error}
        </p>
      )}
    </div>
  );
}
