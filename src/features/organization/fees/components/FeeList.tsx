"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Zap, ChevronRight, CircleDollarSign, DollarSign, Users, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { PageHeader } from "@/components/organization/PageHeader"
import { SearchInput } from "@/components/organization/SearchInput"
import { ViewToggle } from "@/components/organization/ViewToggle"
import { StatCard } from "@/components/organization/StatCard"
import { DataPagination } from "@/components/organization/DataPagination"

import { useFeeList } from "../hooks/useFeeList"
import type { Fee } from "../types"
import { usePaginatedMembers } from "../../members/hooks/usePaginatedMembers"
import { FeeGenerationDialog } from "./AddFeeDialog"
import { Member } from "../../members/types"

const ITEMS_PER_PAGE = 10

// Map fee type to display label and badge variant (keep your existing mapping)
const feeTypeLabels: Record<string, string> = {
  "semester-membership": "Semester Membership",
  "event-fee": "Event Fee",
  "charity-fee": "Charity Fee",
  "organization-dues": "Organization Dues",
}

const feeTypeVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  "semester-membership": "default",
  "event-fee": "secondary",
  "charity-fee": "outline",
  "organization-dues": "destructive",
}

// Aggregated fee type for display
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
  description?: string
}

export default function FeeListPage() {
  const router = useRouter()
  const { rawFees, groupedFees, isLoading: feesLoading, refetchFees } = useFeeList()
  const { members, totalMembers, isLoading: membersLoading } = usePaginatedMembers() // fetch all students

  const [search, setSearch] = useState("")
  const [viewMode, setViewMode] = useState<"card" | "table">("card")
  const [generateOpen, setGenerateOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

   const aggregatedFees = useMemo<AggregatedFee[]>(() => {
        if (!rawFees || !Array.isArray(rawFees)) return [];
  
        // Group fees by title
        const groups = (rawFees as Fee[]).reduce((acc, fee) => {
          const title = fee.title;
          if (!acc[title]) acc[title] = [];
          acc[title].push(fee);
          return acc;
        }, {} as Record<string, Fee[]>);
  
        return Object.entries(groups).map(([title, feeList]) => {
          const first = feeList[0];
          const paidCount = feeList.filter(f => f.status === "verified" || f.status === "paid").length;
          
          return {
            id: `${title}-${first.feeType}-${first.amount}`, 
            title,
            type: first.feeType,
            amount: first.amount,
            academicYear: first.academicYear || "",
            semester: first.semester || "N/A",
            dueDate: first.dueDate,
            isRequiredForClearance: first.isRequiredForClearance,
            totalStudents: feeList.length,
            paidCount,
            description: first.description
          };
        });
      }, [rawFees]);

  console.log(aggregatedFees)

  // Filter by search
  const filtered = useMemo(() => {
    return aggregatedFees.filter(f =>
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      feeTypeLabels[f.type]?.toLowerCase().includes(search.toLowerCase())
    )
  }, [aggregatedFees, search])

  // Pagination
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  // Handle successful generation
  const handleGenerationSuccess = () => {
    refetchFees() // reload the fee list
    setGenerateOpen(false)
  }

  const isLoading = feesLoading || membersLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">

      <Card className="border-border">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base text-foreground">Fee List</CardTitle>
              <CardDescription className="text-muted-foreground">Click a fee to view its payment logs</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <SearchInput
                placeholder="Search fees..."
                value={search}
                onChange={v => { setSearch(v); setCurrentPage(1) }}
                className="w-48"
              />
              <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
              <Button variant="outline" onClick={() => setGenerateOpen(true)}>
                <Zap className="size-4 mr-1" /> Generate Fee
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === "card" ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {paginated.map(fee => {
                  const progress = fee.totalStudents > 0
                    ? Math.round((fee.paidCount / fee.totalStudents) * 100)
                    : 0
                  return (
                    <Card
                      key={fee.id}
                      className="border-border cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => router.push(`/org-fees/roster?title=${encodeURIComponent(fee.title)}&academic_year=${fee.academicYear}`)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-sm font-semibold text-foreground leading-snug">{fee.title}</CardTitle>
                          <ChevronRight className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                        </div>
                        <Badge variant={feeTypeVariant[fee.type]} className="w-fit text-xs">
                          {feeTypeLabels[fee.type] || fee.type}
                        </Badge>
                      </CardHeader>
                      <CardContent className="pb-2">
                        {fee.description && (
                          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{fee.description}</p>
                        )}
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                          <span>{fee.paidCount} / {fee.totalStudents} paid</span>
                          <span className="font-semibold text-foreground">₱{fee.amount.toLocaleString()}</span>
                        </div>
                        <Progress value={progress} className="h-1.5" />
                      </CardContent>
                      <CardFooter className="pt-2">
                        <p className="text-xs text-muted-foreground">{fee.semester ? fee.semester + " Semester" : "" + (fee.academicYear ? " · " + fee.academicYear + " A.Y." : "")}</p>
                      </CardFooter>
                    </Card>
                  )
                })}
                {paginated.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                    <CircleDollarSign className="size-12 text-muted-foreground" />
                    <p className="mt-3 text-sm font-medium text-foreground">No fees found</p>
                  </div>
                )}
              </div>
              <DataPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filtered.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
              />
            </>
          ) : (
            <>
              <div className="rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Collection</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map(fee => {
                      const progress = fee.totalStudents > 0
                        ? Math.round((fee.paidCount / fee.totalStudents) * 100)
                        : 0
                      return (
                        <TableRow
                          key={fee.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => router.push(`/org-fees/roster?title=${encodeURIComponent(fee.title)}&academic_year=${fee.academicYear}`)}
                        >
                          <TableCell>
                            <p className="text-sm font-medium text-foreground">{fee.title}</p>
                            {fee.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">{fee.description}</p>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={feeTypeVariant[fee.type]} className="text-xs">
                              {feeTypeLabels[fee.type] || fee.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm font-medium">₱{fee.amount.toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 min-w-32.5">
                              <Progress value={progress} className="h-1.5 flex-1" />
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {fee.paidCount}/{fee.totalStudents}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {fee.semester ? fee.semester + " Semester" : "" + (fee.academicYear ? " · " + fee.academicYear + " A.Y." : "")}
                          </TableCell>
                          <TableCell>
                            <ChevronRight className="size-4 text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {paginated.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                          No fees found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <DataPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filtered.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </CardContent>
      </Card>
      {/* Generate Fee Dialog */}
      <FeeGenerationDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        students={members as unknown as Member[]} // pass the fetched student list
        onClose={handleGenerationSuccess}
      />
    </div>
  )
}