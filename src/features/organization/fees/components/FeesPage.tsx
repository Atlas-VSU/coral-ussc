"use client";

import { CircleDollarSign, DollarSign, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/organization/general/PageHeader";
import { StatCard } from "@/components/organization/general/StatCard";
import { useFeeList } from "@/features/organization/fees/hooks/useFeeList";
import { usePaginatedMembers } from "@/features/organization/members/hooks/usePaginatedMembers";
import FeeList from "@/features/organization/fees/components/FeeList";
import { FeeGenerationDialog } from "@/features/organization/fees/components/AddFeeDialog";
import { useState } from "react";

import { useRouter } from "next/navigation";
import { Zap, ChevronRight, Loader2, Plus, RefreshCcw } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SearchInput } from "@/components/organization/general/SearchInput";
import { ViewToggle } from "@/components/organization/general/ViewToggle";
import { DataPagination } from "@/components/organization/general/DataPagination";
import { TableSkeleton } from "@/components/organization/skeleton/TableSkeleton";
import { CardGridSkeleton } from "@/components/organization/skeleton/CardGridSkeleton";

// import { FeeGenerationDialog } from "@/features/organization/fees/components/AddFeeDialog"
import { Member } from "@/features/organization/members/types";
import { useFeeListUI } from "@/features/organization/fees/hooks/useFeeListUI";
import {
  feeTypeLabels,
  feeTypeVariant,
} from "@/features/organization/fees/constants";
import { SearchFilterBar } from "@/features/organization/fees/components/SearchFilterBar";
// import { SearchFilterFee } from "@/features/organization/fees/components/SearchFilterFee"
import { SearchFilterFee } from "./SearchFilterFee";
const ITEMS_PER_PAGE = 10;

export function FeesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const router = useRouter();
  const [navigatingId, setNavigatingId] = useState<string | null>(null);
  const {
    aggregatedFees,
    isLoading: feesLoading,
    refetchFees,
    totalCollected,
    totalFees,
    totalStudents,
  } = useFeeList();
  const {
    totalMembers,
    members,
    isLoading: membersLoading,
  } = usePaginatedMembers();

  const {
    state: {
      search,
      filterStatus,
      viewMode,
      generateOpen,
      currentPage,
      isLoading,
    },
    actions: {
      setSearch,
      setFilterStatus,
      setViewMode,
      setGenerateOpen,
      setCurrentPage,
      handleGenerationSuccess,
    },
    computed: { filtered, paginated, totalPages },
  } = useFeeListUI({
    aggregatedFees,
    feesLoading,
    membersLoading,
    refetchFees,
    itemsPerPage: ITEMS_PER_PAGE,
  });

  const handleRefresh = () => {
    setSearch("");
    setFilterStatus("all");
    setCurrentPage(1);
    refetchFees();
  };

  const handleFeeClick = (fee: {
    title: string;
    academicYear: string;
    id: string;
    amount?: number;
    semester?: string;
    description?: string;
    type?: string;
  }) => {
    setNavigatingId(fee.id);
    // Stash basic fee metadata so the roster page can hydrate instantly
    try {
      sessionStorage.setItem(
        `fee-prefetch:${fee.title}:${fee.academicYear}`,
        JSON.stringify({
          title: fee.title,
          academicYear: fee.academicYear,
          amount: fee.amount,
          semester: fee.semester,
          description: fee.description,
          type: fee.type,
        }),
      );
    } catch {}
    router.push(
      `/org-fees/roster?title=${encodeURIComponent(fee.title)}&academic_year=${fee.academicYear}&semester=${fee.semester}`,
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Card className="border-border">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-[120px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-32" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === "card" ? (
              <CardGridSkeleton count={6} />
            ) : (
              <TableSkeleton columns={5} rows={10} />
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
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
            value={`${totalStudents > 0 ? (totalCollected / totalStudents).toFixed(2) : 0}%`}
            description="Overall completion"
            icon={Users}
          />
        </div>

        <FeeList />

        <FeeGenerationDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          studentsCount={totalMembers}
        />
      </div>
    </>
  );
}
