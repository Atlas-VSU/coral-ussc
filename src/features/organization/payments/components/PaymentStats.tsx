import { StatCard } from "@/components/organization/StatCard"
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
      <StatCard title="Pending Review"   value={pending.toString()}  description="Awaiting approval"       icon={Clock}       />
      <StatCard title="Approved"         value={approved.toString()} description="Successfully approved payments"   icon={CheckCircle} />
      <StatCard title="Declined"         value={declined.toString()} description="Rejected submissions"    icon={XCircle}     />
      <StatCard title="Unpaid Students"  value={unpaid.toString()}   description="With unsettled dues"     icon={Users}       />
    </div>
  )
}
