"use client";

import { useState } from "react";
import { CircleDollarSign, DollarSign, Users } from "lucide-react";

import { FeeGenerationDialog } from "./AddFeeDialog";
import FeeListPage from "./FeeList";
import { useFeeList } from "../hooks/useFeeList";
import { usePaginatedMembers } from "../../members/hooks/usePaginatedMembers";
import { PageHeader } from "@/components/organization/general/PageHeader";
import { StatCard } from "@/components/organization/general/StatCard";
import { StatCardsCarousel } from "@/components/organization/general/StatCardsCarousel";


export function FeesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

    const { aggregatedFees } = useFeeList()
    const { totalMembers } = usePaginatedMembers()
   
    
    const totalCollected = aggregatedFees.reduce((sum, f) => sum + f.paidCount * f.amount, 0)
    const avgCompletion = aggregatedFees.length > 0
      ? Math.round(aggregatedFees.reduce((sum, f) => sum + (f.totalStudents > 0 ? (f.paidCount / f.totalStudents) * 100 : 0), 0) / aggregatedFees.length)
      : 0

  return (
    <div className="flex flex-col gap-6 pb-5 lg:pb-0">
      <PageHeader
        variant="admin"
        title="Fees Management"
        context="2nd Semester · A.Y. 2025–2026"
        description="Manage your organisation's fees and track collection progress"
      />
      
      <StatCardsCarousel className="grid-cols-3">
        <StatCard title="Total Fees" value={aggregatedFees.length} description="Active fee categories" icon={CircleDollarSign} />
        <StatCard title="Total Collected" value={`₱${totalCollected.toLocaleString()}`} description="Across all fees" icon={DollarSign} />
        <StatCard title="Avg. Collection Rate" value={`${avgCompletion}%`} description="Overall completion" icon={Users} />
      </StatCardsCarousel>

      <FeeListPage />
      
      <FeeGenerationDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        studentsCount={totalMembers}
      />
    </div>
  );
}