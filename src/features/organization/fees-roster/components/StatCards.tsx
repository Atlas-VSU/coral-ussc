import { Clock, CheckCircle, XCircle, MinusCircle } from "lucide-react";
import { StatCard } from "@/components/organization/general/StatCard";
    
export function StatCards({ stats }: { stats: { pending: number; verified: number; rejected: number; unpaid: number } }) {
  return (
    <div className="grid gap-4 sm:grid-cols-4">
      <StatCard title="Pending" value={stats.pending.toLocaleString()} description="Awaiting verification" icon={Clock} />
      <StatCard title="Verified" value={stats.verified.toLocaleString()} description="Payments confirmed" icon={CheckCircle} />
      {/* <StatCard title="Rejected" value={stats.rejected} description="Payments declined" icon={XCircle} /> */}
      <StatCard title="Unpaid" value={stats.unpaid.toLocaleString()} description="No submission yet" icon={MinusCircle} />
    </div>
  );
}