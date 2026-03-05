"use client";

import { useState, useEffect, useMemo } from "react";
import { CircleDollarSign, DollarSign, Plus, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUsers } from "@/firebase/users";
import { Member } from "@/features/organization/members/types";
import { FeeGenerationDialog } from "./AddFeeDialog";
import FeeListPage from "./FeeList";
import { PageHeader } from "@/components/organization/PageHeader";
import { StatCard } from "@/components/organization/StatCard";
import { useFeeList } from "../hooks/useFeeList";
import { Fee } from "../types";
import { usePaginatedMembers } from "../../members/hooks/usePaginatedMembers";


export function FeesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

    const { aggregatedFees } = useFeeList()
    const { members } = usePaginatedMembers()
  
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

      {aggregatedFees.length > 0 ? (
        <FeeListPage />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No fees generated yet</CardTitle>
            <CardDescription>
              You haven't generated any fees for this academic year. Click the button above to start.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
              <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                  <Plus className="h-10 w-10" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">No fees generated yet</h3>
                <p className="mb-4 mt-2 text-sm text-muted-foreground">
                  You haven't generated any fees for this academic year. Click the button above to start.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <FeeGenerationDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        students={members.map((m) => m.member)}
      />
    </div>
  );
}
