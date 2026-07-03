import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusVariant =
  | "active"
  | "inactive"
  | "archived"
  | "deleted"
  | "subscribed"
  | "unsubscribed";

interface StatusBadgeProps {
  variant: StatusVariant;
  className?: string;
}

const statusConfig: Record<
  StatusVariant,
  { label: string; className: string }
> = {
  active: {
    label: "Active",
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50",
  },
  inactive: {
    label: "Inactive",
    className:
      "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50",
  },
  archived: {
    label: "Archived",
    className:
      "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-100",
  },
  deleted: {
    label: "Deleted",
    className:
      "bg-red-50 text-red-600 border-red-200 hover:bg-red-50",
  },
  subscribed: {
    label: "Subscribed",
    className:
      "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50",
  },
  unsubscribed: {
    label: "Not Subscribed",
    className:
      "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-50",
  },
};

export function StatusBadge({ variant, className }: StatusBadgeProps) {
  const config = statusConfig[variant];
  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium border", config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
