"use client";

import { useState, useEffect, useMemo } from "react";
import { CircleDollarSign, DollarSign, Plus, Users, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUsers } from "@/firebase/users";
import { Member } from "@/features/organization/members/types";
import { FeeGenerationDialog } from "./AddFeeDialog";
import FeeListPage from "./FeeList";
import { useFeeList } from "../hooks/useFeeList";
import { usePaginatedMembers } from "../../members/hooks/usePaginatedMembers";
import { PageHeader } from "@/components/organization/general/PageHeader";
import { StatCard } from "@/components/organization/general/StatCard";


export function FeesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

    const { aggregatedFees } = useFeeList()
    const { totalMembers } = usePaginatedMembers()
   
    
    const totalCollected = aggregatedFees.reduce((sum, f) => sum + f.paidCount * f.amount, 0)
    const avgCompletion = aggregatedFees.length > 0
      ? Math.round(aggregatedFees.reduce((sum, f) => sum + (f.totalStudents > 0 ? (f.paidCount / f.totalStudents) * 100 : 0), 0) / aggregatedFees.length)
      : 0

  return (
    <div className="p-6 space-y-6">
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