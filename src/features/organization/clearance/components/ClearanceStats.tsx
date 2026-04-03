"use client"

import { ShieldCheck, Clock, AlertTriangle } from "lucide-react"
import { StatCard } from "@/components/organization/general/StatCard"
import { StatCardsCarousel } from "@/components/organization/general/StatCardsCarousel"

export function ClearanceStats({ stats }: { stats: { cleared: number; not_cleared: number; pending: number } }) {
  const cleared = stats.cleared
  const pending = stats.pending
  const notCleared = stats.not_cleared

  return (
    <StatCardsCarousel className="grid-cols-3">
      <StatCard 
        title="Cleared" 
        value={cleared.toLocaleString()} 
        description="Students fully cleared" 
        icon={ShieldCheck} 
        variant="success"
      />
      <StatCard 
        title="Pending" 
        value={pending.toLocaleString()} 
        description="Awaiting requirements" 
        icon={Clock} 
        variant="warning"
      />
      <StatCard 
        title="Not Cleared" 
        value={notCleared.toLocaleString()} 
        description="Outstanding payments" 
        icon={AlertTriangle} 
        variant="danger"
      />
    </StatCardsCarousel>
  )
}