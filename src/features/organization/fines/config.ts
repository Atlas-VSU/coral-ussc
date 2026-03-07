

export const appealStatusConfig: Record<string, {
  label: string;
  variant: "outline" | "secondary" | "destructive";
}> = {
  pending:  { label: "Pending",  variant: "outline"     },
  approved: { label: "Approved", variant: "secondary"   },
  rejected: { label: "Rejected", variant: "destructive" },
};
