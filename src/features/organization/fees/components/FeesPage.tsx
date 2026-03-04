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

interface AggregatedFee {
  id: string                // use title + type + amount as a composite key
  title: string
  type: string
  amount: number
  academicYear: string
  semester: string
  dueDate?: string
  isRequiredForClearance: boolean
  totalStudents: number
  paidCount: number
  // we might not have description in backend, so omit or use optional
  description?: string
}

export function FeesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [students, setStudents] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const users = await getUsers();
        // Transform MemberData[] to Member[]
        const studentList = users.map(u => ({
          ...u.member,
          id: u.id
        })) as Member[];
        setStudents(studentList);
      } catch (error) {
        console.error("Failed to fetch students:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, []);

    const { rawFees, groupedFees, isLoading: feesLoading, refetchFees } = useFeeList()
  
    // Build aggregated fees from groupedFees
    const aggregatedFees = useMemo<AggregatedFee[]>(() => {
      return Object.entries(groupedFees).map(([title, feeList]) => {
        // Use the first fee in the group as the template (all should share same details)
        const first = feeList[0]
        // Compute paid count (assuming fee has a 'status' field; adjust if needed)
        const paidCount = feeList.filter(f => f.status === "paid").length
        return {
          id: `${title}-${first.feeType}-${first.amount}`, // simple composite key
          title,
          type: first.feeType,
          amount: first.amount,
          academicYear: first.academicYear || "",
          semester: first.semester || "N/A",
          dueDate: first.dueDate,
          isRequiredForClearance: first.isRequiredForClearance,
          totalStudents: feeList.length,
          paidCount,
          // description not available from backend; could be omitted
        }
      })
    }, [groupedFees])

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
      {/* <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            You can generate a new fee batch by clicking the "Generate Fees" button.
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
      </Card> */}

      <FeeGenerationDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        students={students}
      />
    </div>
  );
}
