"use client";

import { useState, useEffect, useMemo } from "react";
import { CircleDollarSign, DollarSign, Plus, Users, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUsers } from "@/firebase/users";
import { Member } from "@/features/organization/members/types";
// import { FeeGenerationDialog } from "@/features/organization/fees/components/AddFeeDialog";
// import FeeListPage from "@/features/organization/fees/components//FeeList";
// import { PageHeader } from "@/components/organization/PageHeader";
// import { StatCard } from "@/components/organization/StatCard";
import { useFeeList } from "@/features/organization/fees/hooks/useFeeList";
import { Fee } from "@/features/organization/fees/types";
import { usePaginatedMembers } from "@/features/organization/members/hooks/usePaginatedMembers";
import { SearchInput } from "@/components/organization/SearchInput";
import { ViewToggle } from "@/components/organization/ViewToggle";
import { SearchFilterFee } from "@/features/organization/fees/components/SearchFilterFee";
import { useFeeListUI } from "@/features/organization/fees/hooks/useFeeListUI";
import { PageHeader } from "./PageHeader";
import { StatCard } from "./StatCard";
import FeeListPage from "./FeeListPage";
import { FeeGenerationDialog } from "./AddFeeDialog";
export function FeesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

    const { aggregatedFees } = useFeeList()
    const { totalMembers } = usePaginatedMembers()
   
    
    const totalCollected = aggregatedFees.reduce((sum, f) => sum + f.paidCount * f.amount, 0)
    const avgCompletion = aggregatedFees.length > 0
      ? Math.round(aggregatedFees.reduce((sum, f) => sum + (f.totalStudents > 0 ? (f.paidCount / f.totalStudents) * 100 : 0), 0) / aggregatedFees.length)
      : 0

  return (
    <div className="space-y-6 py-8">
      <PageHeader
        title="Fees"
        context="2nd Semester · A.Y. 2025–2026"
        description="Management and tracking of Council/Organization Fees"
      />
      
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Total Fees" value={aggregatedFees.length} description="Active fee categories" icon={CircleDollarSign} />
        <StatCard title="Total Collected" value={`₱${totalCollected.toLocaleString()}`} description="Across all fees" icon={DollarSign} />
        <StatCard title="Avg. Collection Rate" value={`${avgCompletion}%`} description="Overall completion" icon={Users} />
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
