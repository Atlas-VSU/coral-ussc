
import { CheckCircle, XCircle, Clock } from "lucide-react"

export const ITEMS_PER_PAGE = 10

export const statusConfig: Record<string, {
  label: string
  variant: "default" | "secondary" | "destructive"
  icon: typeof Clock
}> = {
  pending:  { label: "Pending",  variant: "default",     icon: Clock       },
  verified: { label: "Approved", variant: "secondary",   icon: CheckCircle },
  rejected: { label: "Declined", variant: "destructive", icon: XCircle     },
}
