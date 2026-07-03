import { Badge } from "@/components/ui/badge";
import type { SubscriptionTier } from "@/features/super-admin/types";
import { cn } from "@/lib/utils";

interface TierBadgeProps {
  tier: SubscriptionTier | null;
  className?: string;
}

const tierConfig: Record<
  SubscriptionTier,
  { label: string; className: string }
> = {
  basic: {
    label: "Basic",
    className:
      "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100",
  },
  plus: {
    label: "Plus",
    className:
      "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100",
  },
  premium: {
    label: "Premium",
    className:
      "bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-100",
  },
};

export function TierBadge({ tier, className }: TierBadgeProps) {
  if (!tier) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "text-xs font-medium bg-gray-50 text-slate-400 border-gray-200 hover:bg-gray-50",
          className
        )}
      >
        None
      </Badge>
    );
  }

  const config = tierConfig[tier];
  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-semibold border", config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
