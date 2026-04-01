import { StatCard } from "@/components/organization/general/StatCard"
import { CheckCircle, XCircle, Clock, Users } from "lucide-react"

interface PaymentStatsProps {
  pending: number
  approved: number
  declined: number
  unpaid: number
}

export function PaymentStats({ pending, approved, declined, unpaid }: PaymentStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-4">
      <StatCard title="Pending Review"   value={pending.toLocaleString()}  description="Awaiting approval"       icon={Clock}       />
      <StatCard title="Approved"         value={approved.toLocaleString()} description="Successfully approved payments"   icon={CheckCircle} />
      <StatCard title="Declined"         value={declined.toLocaleString()} description="Rejected submissions"    icon={XCircle}     />
      <StatCard title="Unpaid Students"  value={unpaid.toLocaleString()}   description="With unsettled dues"     icon={Users}       />
    </div>
  )
}
