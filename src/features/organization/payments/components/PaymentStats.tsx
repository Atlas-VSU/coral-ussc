import { StatCard } from "@/components/organization/general/StatCard"
import { StatCardsCarousel } from "@/components/organization/general/StatCardsCarousel"
import { CheckCircle, XCircle, Clock, Users } from "lucide-react"

interface PaymentStatsProps {
  pending: number
  approved: number
  declined: number
  unpaid: number
}

export function PaymentStats({ pending, approved, declined, unpaid }: PaymentStatsProps) {
  return (
    <StatCardsCarousel className="grid-cols-4">
      <StatCard 
        title="Pending Review"   
        value={pending.toLocaleString()}  
        description="Awaiting approval"       
        icon={Clock}
        variant="warning"
      />
      <StatCard 
        title="Approved"         
        value={approved.toLocaleString()} 
        description="Successfully approved payments"   
        icon={CheckCircle}
        variant="success"
      />
      <StatCard 
        title="Declined"         
        value={declined.toLocaleString()} 
        description="Rejected submissions"    
        icon={XCircle}
        variant="danger"
      />
      <StatCard 
        title="Unpaid Students"  
        value={unpaid.toLocaleString()}   
        description="With unsettled dues"     
        icon={Users}
        variant="info"
      />
    </StatCardsCarousel>
  )
}
