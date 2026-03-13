"use client"

import { ShieldCheck } from "lucide-react"
import type { ClearanceStatus } from "../types"
import { StatCard } from "@/components/organization/StatCard"

export function ClearanceStats({ clearances }: { clearances: ClearanceStatus[] }) {
  const cleared = clearances.filter(c => c.status === "cleared").length
  const pending = clearances.filter(c => c.status === "pending").length
  const notCleared = clearances.filter(c => c.status === "not_cleared").length

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard title="Cleared" value={cleared} description="Students fully cleared" icon={ShieldCheck} />
      <StatCard title="Pending" value={pending} description="Awaiting requirements" icon={ShieldCheck} />
      <StatCard title="Not Cleared" value={notCleared} description="Outstanding payments" icon={ShieldCheck} />
    </div>
  )
}