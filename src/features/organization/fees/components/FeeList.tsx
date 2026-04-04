"use client"

import { useRouter } from "next/navigation"
import { Zap, ChevronRight, CircleDollarSign, Loader2 } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useFeeList } from "@/features/organization/fees/hooks/useFeeList"
import { usePaginatedMembers } from "@/features/organization/members/hooks/usePaginatedMembers"
import { useFeeListUI } from "@/features/organization/fees/hooks/useFeeListUI"
import { feeTypeLabels, feeTypeVariant } from "@/features/organization/fees/constants"
import { FeeGenerationDialog } from "./AddFeeDialog"
import { FeesFilters } from "./FeesFilters"
import { useState, useEffect } from "react"
import React from "react"
import { CardGridSkeleton } from "@/components/organization/skeleton/CardGridSkeleton"
import { TableSkeleton } from "@/components/organization/skeleton/TableSkeleton"
import { Progress } from "@/components/ui/progress"
import { DataPagination } from "@/components/organization/general/DataPagination"

const ITEMS_PER_PAGE = 9

export default function FeeListPage() {
  const router = useRouter()
  const [navigatingId, setNavigatingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const { aggregatedFees, isLoading: feesLoading, refetchFees } = useFeeList()
  const { totalMembers, isLoading: membersLoading } = usePaginatedMembers() 
  
  const {
    state: { search, filterStatus, viewMode, generateOpen, currentPage, isLoading, sortBy },
    actions: { setSearch, setFilterStatus, setViewMode, setGenerateOpen, setCurrentPage, handleGenerationSuccess, setSortBy },
    computed: { filtered, paginated, totalPages }
  } = useFeeListUI({
    aggregatedFees,
    feesLoading,
    membersLoading,
    refetchFees,
    itemsPerPage: ITEMS_PER_PAGE
  })
  
  useEffect(() => {
    setSearchTerm(search)
  }, [search])

  const handleSearchCommit = () => {
    setSearch(searchTerm)
    setCurrentPage(1)
  }

  const handleSearchClear = () => {
    setSearchTerm("")
    setSearch("")
    setCurrentPage(1)
  }

  const handleRefresh = () => {
    handleSearchClear()
    setFilterStatus("all")
    setSortBy("title-asc")
    refetchFees()
  }

  const handleFeeClick = (fee: { title: string; academicYear: string; id: string; amount?: number; semester?: string; description?: string; type?: string }) => {
    setNavigatingId(fee.id)
    // Stash basic fee metadata so the roster page can hydrate instantly
    try {
      sessionStorage.setItem(
        `fee-prefetch:${fee.title}:${fee.academicYear}`,
        JSON.stringify({ title: fee.title, academicYear: fee.academicYear, amount: fee.amount, semester: fee.semester, description: fee.description, type: fee.type })
      )
    } catch {}
    
    router.push(`/org-fees/roster?feeItemId=${fee.id}`)
  }

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <FeesFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearchCommit={handleSearchCommit}
        onSearchClear={handleSearchClear}
        onTypeFilter={(type) => {
          setFilterStatus(type as any)
          setCurrentPage(1)
        }}
        onSortBy={setSortBy}
        typeFilter={filterStatus}
        onRefresh={handleRefresh}
        disabled={isLoading}
        viewMode={viewMode}
        onViewChange={setViewMode}
      />

      {/* Fee List Card */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
                Fee Categories
              </CardTitle>
              <CardDescription>{filtered.length} fee{filtered.length !== 1 ? "s" : ""} found</CardDescription>
            </div>
            <Button 
              variant="default"
              onClick={() => setGenerateOpen(true)}
            >
              <Zap className="size-4" /> Generate Fee
            </Button>
          </div>
        </CardHeader>
        

      <CardContent>
        {isLoading ? (
          viewMode === "card" ? (
            <CardGridSkeleton count={9} />
          ) : (
            <TableSkeleton columns={6} rows={9} />
          )
        ) : paginated.length === 0 ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
            <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <CircleDollarSign className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">
                {search || filterStatus !== "all" ? "No fees found" : "No fees generated yet"}
              </h3>
              <p className="mb-4 mt-2 text-sm text-muted-foreground">
                {search || filterStatus !== "all"
                  ? "No fees match your current filters. Try adjusting your search or filter criteria."
                  : "You haven't generated any fees for this academic year. Click the \"Generate Fee\" button to start."}
              </p>
              {(search || filterStatus !== "all") && (
                <Button variant="outline" onClick={handleSearchClear}>
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        ) : viewMode === "card" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginated.map(fee => {
              const progress = fee.totalStudents > 0
                ? Math.round((fee.paidCount / fee.totalStudents) * 100)
                : 0
              return (
                <React.Fragment key={fee.id}>
                  {/* Mobile Layout (< md) */}
                  <Card
                    className={`md:hidden group hover:shadow-md active:shadow-sm transition-all duration-200 border-border bg-card overflow-hidden ${navigatingId === fee.id ? "opacity-60 pointer-events-none" : ""}`}
                    onClick={() => handleFeeClick(fee)}
                  >
                    <CardContent className="p-0">
                      <div className="w-full p-3 flex items-center gap-3 text-left active:bg-muted/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm text-foreground truncate">
                              {fee.title}
                            </h3>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge variant={feeTypeVariant[fee.type]} className="text-xs px-1.5 py-0.5">
                              {feeTypeLabels[fee.type] || fee.type}
                            </Badge>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">₱{fee.amount.toLocaleString()}</span>
                          </div>
                        </div>
                        {navigatingId === fee.id
                          ? <Loader2 className="size-4 text-muted-foreground shrink-0 animate-spin" />
                          : <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                        }
                      </div>
                      
                      <div className="overflow-hidden">
                        <div className="px-3 pb-3 space-y-2 border-t border-border pt-2">
                          <div className="flex items-center gap-2 text-xs">
                            <Zap className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground">
                              {fee.paidCount} / {fee.totalStudents} collected ({progress}%)
                            </span>
                          </div>
                          <Progress value={progress} className="h-1.5" />
                          {fee.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed pt-1">
                              {fee.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Desktop Layout (>= md) */}
                  <Card
                    className={`hidden md:flex group hover:shadow-lg transition-all duration-300 border-border bg-card overflow-hidden cursor-pointer h-full flex-col ${navigatingId === fee.id ? "opacity-60 pointer-events-none" : ""}`}
                    onClick={() => handleFeeClick(fee)}
                  >
                    <CardHeader className="px-5 pt-5 pb-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            <Badge variant={feeTypeVariant[fee.type]} className="text-xs px-2.5 py-1">
                              {feeTypeLabels[fee.type] || fee.type}
                            </Badge>
                          </div>
                          <CardTitle className="text-base font-bold text-foreground leading-tight truncate">
                            {fee.title}
                          </CardTitle>
                          {fee.description && (
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{fee.description}</p>
                          )}
                        </div>
                        {navigatingId === fee.id
                          ? <Loader2 className="size-4 text-muted-foreground shrink-0 animate-spin opacity-0 group-hover:opacity-100 transition-opacity" />
                          : <ChevronRight className="size-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        }
                      </div>
                    </CardHeader>

                    <div className="border-t border-border mx-5" />

                    <CardContent className="px-5 py-4 flex-1 flex flex-col gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center shrink-0">
                          <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Amount</p>
                          <p className="text-sm font-semibold text-foreground">₱{fee.amount.toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center shrink-0">
                          <Zap className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Collection Progress</p>
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground font-medium">{fee.paidCount} / {fee.totalStudents}</span>
                              <span className="text-muted-foreground font-semibold">{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                        </div>
                      </div>

                      <div className="mt-auto pt-3 border-t border-border">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Period</p>
                        <p className="text-xs text-muted-foreground">
                          {fee.semester ? fee.semester + " Semester" : ""}{fee.academicYear ? " · " + fee.academicYear : ""}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </React.Fragment>
              )
            })}
          </div>
        ) : (
          <div className="rounded-md border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Collection</TableHead>
                  <TableHead className="hidden md:table-cell">Period</TableHead>
                  <TableHead className="w-12" />
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
                      className={`border-border cursor-pointer hover:bg-muted/50 transition-colors ${navigatingId === fee.id ? "opacity-60 pointer-events-none" : ""}`}
                      onClick={() => handleFeeClick(fee)}
                    >
                      <TableCell>
                        <p className="text-sm font-medium text-foreground">{fee.title}</p>
                        {fee.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed mt-0.5">{fee.description}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={feeTypeVariant[fee.type]} className="text-xs whitespace-nowrap">
                          {feeTypeLabels[fee.type] || fee.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-foreground whitespace-nowrap">₱{fee.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <Progress value={progress} className="h-1.5 flex-1" />
                          <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">
                            {fee.paidCount}/{fee.totalStudents}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden md:table-cell whitespace-nowrap">
                        {fee.semester ? fee.semester + " Sem" : ""}{fee.academicYear ? " · " + fee.academicYear : ""}
                      </TableCell>
                      <TableCell>
                        {navigatingId === fee.id
                          ? <Loader2 className="size-4 text-muted-foreground animate-spin" />
                          : <ChevronRight className="size-4 text-muted-foreground" />
                        }
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {paginated.length > 0 && (
          <DataPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        )}
      </CardContent>

      {/* Generate Fee Dialog */}
      <FeeGenerationDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        studentsCount={totalMembers}
        onClose={handleGenerationSuccess}
      />
      </Card>
    </div>
  )
}
