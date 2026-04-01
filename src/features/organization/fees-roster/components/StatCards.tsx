import { Clock, CheckCircle, XCircle, MinusCircle } from "lucide-react";
import { StatCard } from "@/components/organization/general/StatCard";
import { StatCardsCarousel } from "@/components/organization/general/StatCardsCarousel";
    
export function StatCards({ stats }: { stats: { pending: number; verified: number; rejected: number; unpaid: number } }) {
  return (
    <StatCardsCarousel className="grid-cols-3">
      <StatCard title="Pending" value={stats.pending.toLocaleString()} description="Awaiting verification" icon={Clock} />
      <StatCard title="Verified" value={stats.verified.toLocaleString()} description="Payments confirmed" icon={CheckCircle} />
      {/* <StatCard title="Rejected" value={stats.rejected} description="Payments declined" icon={XCircle} /> */}
      <StatCard title="Unpaid" value={stats.unpaid.toLocaleString()} description="No submission yet" icon={MinusCircle} />
    </StatCardsCarousel>
  );
}