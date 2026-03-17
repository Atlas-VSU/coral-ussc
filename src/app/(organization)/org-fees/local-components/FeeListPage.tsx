"use client"

import { useRouter } from "next/navigation"
import { Zap, ChevronRight, CircleDollarSign, Loader2, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { SearchInput } from "@/components/organization/SearchInput"
import { ViewToggle } from "@/components/organization/ViewToggle"
import { DataPagination } from "@/components/organization/DataPagination"

import { useFeeList } from "@/features/organization/fees/hooks/useFeeList"
import { usePaginatedMembers } from "@/features/organization/members/hooks/usePaginatedMembers"
// import { FeeGenerationDialog } from "@/features/organization/fees/components/AddFeeDialog"
import { Member } from "@/features/organization/members/types"
import { useFeeListUI } from "@/features/organization/fees/hooks/useFeeListUI"
import { feeTypeLabels, feeTypeVariant } from "@/features/organization/fees/constants"
import { SearchFilterBar } from "@/features/organization/fees/components/SearchFilterBar"
import { SearchFilterFee } from "@/features/organization/fees/components/SearchFilterFee"
import { FeeGenerationDialog } from "./AddFeeDialog"
const ITEMS_PER_PAGE = 10

export default function FeeListPage() {
  const router = useRouter()
  const { aggregatedFees, isLoading: feesLoading, refetchFees } = useFeeList()
  const { totalMembers, members, isLoading: membersLoading } = usePaginatedMembers() 
  

  const {
    state: { search, filterStatus, viewMode, generateOpen, currentPage, isLoading },
    actions: { setSearch, setFilterStatus, setViewMode, setGenerateOpen, setCurrentPage, handleGenerationSuccess },
    computed: { filtered, paginated, totalPages }
  } = useFeeListUI({
    aggregatedFees,
    feesLoading,
    membersLoading,
    refetchFees,
    itemsPerPage: ITEMS_PER_PAGE
  })

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
              <SearchFilterFee
                search={search}
                onSearchChange={setSearch}
                filterStatus={filterStatus}
                onFilterChange={setFilterStatus as any}
              />
              <ViewToggle viewMode={viewMode} onViewChange={() => setViewMode(viewMode === "card" ? "table" : "card")} />
              <Button variant="outline" onClick={() => setGenerateOpen(true)}>
                <Zap className="size-4 mr-1" /> Generate Fee
              </Button>
            </div>
          </div>
        </CardHeader>
        {paginated.length === 0 && (
                  <div className="flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 mx-8 text-center animate-in fade-in-50">
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
                )}
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
                        <p className="text-xs text-muted-foreground">{fee.semester ? fee.semester + " Semester" : ""} {fee.academicYear ? " - " + fee.academicYear + " A.Y." : ""}</p>
                      </CardFooter>
                    </Card>
                  )
                })}
                
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
        studentsCount={totalMembers}
        onClose={handleGenerationSuccess}
      />
    </div>
  )
}