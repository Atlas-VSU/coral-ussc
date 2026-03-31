"use client"

import { ShieldCheck } from "lucide-react"
import { StatCard } from "@/components/organization/general/StatCard"

export function ClearanceStats({ stats }: { stats: { cleared: number; not_cleared: number; pending: number } }) {
  const cleared = stats.cleared
  const pending = stats.pending
  const notCleared = stats.not_cleared

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard title="Cleared" value={cleared.toLocaleString()} description="Students fully cleared" icon={ShieldCheck} />
      <StatCard title="Pending" value={pending.toLocaleString()} description="Awaiting requirements" icon={ShieldCheck} />
      <StatCard title="Not Cleared" value={notCleared.toLocaleString()} description="Outstanding payments" icon={ShieldCheck} />
    </div>
  )
}