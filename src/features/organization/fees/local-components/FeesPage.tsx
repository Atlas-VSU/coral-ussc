"use client";

import { CircleDollarSign, DollarSign, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/organization/PageHeader";
import { StatCard } from "@/components/organization/StatCard";
import { useFeeList } from "@/features/organization/fees/hooks/useFeeList";
import { usePaginatedMembers } from "@/features/organization/members/hooks/usePaginatedMembers";
import FeeListPage from "@/features/organization/fees/local-components/FeeListPage";
import { FeeGenerationDialog } from "@/features/organization/fees/components/AddFeeDialog";
import { useState } from "react";

export function FeesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

    const { aggregatedFees, totalCollected, totalFees, totalStudents } = useFeeList()
    const { totalMembers } = usePaginatedMembers()
    
  return (
    <div className="flex flex-col gap-6 pb-24 lg:pb-0">
      <PageHeader
        variant="admin"
        title="Fees"
        context="2nd Semester · A.Y. 2025–2026"
        description="Management and tracking of Council/Organization Fees"
      />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <StatCard
          title="Total Fees"
          value={totalFees}
          description="Active fee categories"
          icon={CircleDollarSign}
        />
        <StatCard
          title="Total Collected"
          value={`₱${totalCollected.toLocaleString()}`}
          description="Across all fees"
          icon={DollarSign}
        />
        <StatCard
          title="Avg. Collection Rate"
          value={`${(totalCollected / totalStudents).toFixed(2)}%`}
          description="Overall completion"
          icon={Users}
        />
      </div>

      <FeeListPage />

      <FeeGenerationDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        studentsCount={totalMembers}
      />
    </div>
  );
}