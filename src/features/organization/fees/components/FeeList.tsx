"use client"

import { useRouter } from "next/navigation"
import { Zap, ChevronRight, CircleDollarSign, Loader2, RefreshCcw, Search } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { SearchInput } from "@/components/organization/general/SearchInput"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFeeList } from "@/features/organization/fees/hooks/useFeeList"
import { usePaginatedMembers } from "@/features/organization/members/hooks/usePaginatedMembers"
// import { FeeGenerationDialog } from "@/features/organization/fees/components/AddFeeDialog"
import { Member } from "@/features/organization/members/types"
import { useFeeListUI } from "@/features/organization/fees/hooks/useFeeListUI"
import { feeTypeLabels, feeTypeVariant } from "@/features/organization/fees/constants"
import { SearchFilterBar } from "@/features/organization/fees/components/SearchFilterBar"
// import { SearchFilterFee } from "@/features/organization/fees/components/SearchFilterFee"
import { FeeGenerationDialog } from "./AddFeeDialog"
import { useState, useEffect } from "react"
import { CardGridSkeleton } from "@/components/organization/skeleton/CardGridSkeleton"
import { TableSkeleton } from "@/components/organization/skeleton/TableSkeleton"
import { ViewToggle } from "@/components/organization/general/ViewToggle"
import { Progress } from "@/components/ui/progress"
import { DataPagination } from "@/components/organization/general/DataPagination"

const ITEMS_PER_PAGE = 9

export default function FeeListPage() {
  const router = useRouter()
  const [navigatingId, setNavigatingId] = useState<string | null>(null)
  const [localSearch, setLocalSearch] = useState("")
  const { aggregatedFees, isLoading: feesLoading, refetchFees } = useFeeList()
  const { totalMembers, isLoading: membersLoading } = usePaginatedMembers() 
  
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
  
  useEffect(() => {
    setLocalSearch(search)
  }, [search])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(localSearch)
    setCurrentPage(1)
  }

  const handleRefresh = () => {
    setLocalSearch("")
    setSearch("")
    setFilterStatus("all")
    setCurrentPage(1)
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
    router.push(`/org-fees/roster?title=${encodeURIComponent(fee.title)}&academic_year=${fee.academicYear}&semester=${fee.semester}`)
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
              Fee Categories
            </CardTitle>
            <CardDescription>{filtered.length} fee{filtered.length !== 1 ? "s" : ""} found</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <SearchInput
                placeholder="Search by title or type..."
                value={localSearch}
                onChange={v => setLocalSearch(v)}
                className="w-48 sm:w-64"
              />
              <Button type="submit" variant="secondary" size="icon" disabled={isLoading}>
                <Search className="h-4 w-4" />
                <span className="sr-only">Search</span>
              </Button>
            </form>
            <Select value={filterStatus} onValueChange={v => { setFilterStatus(v as any); setCurrentPage(1) }}>
              <SelectTrigger className="w-28 sm:w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="mandatory">Mandatory</SelectItem>
                <SelectItem value="voluntary">Voluntary</SelectItem>
                <SelectItem value="event">Event</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleRefresh} variant="outline" disabled={isLoading}>
              <RefreshCcw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </Button>
            <ViewToggle viewMode={viewMode} onViewChange={() => setViewMode(viewMode === "card" ? "table" : "card")} />
            <Button 
              className="gap-1.5 bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 disabled:bg-green-300 disabled:text-green-100" 
              onClick={() => setGenerateOpen(true)}
            >
              <Zap className="size-4" /> Generate Fee
            </Button>
          </div>
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
                <Button variant="outline" onClick={handleRefresh}>
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
                <Card
                  key={fee.id}
                  className={`group hover:shadow-md transition-shadow border-border bg-card overflow-hidden cursor-pointer ${navigatingId === fee.id ? "opacity-60 pointer-events-none" : ""}`}
                  onClick={() => handleFeeClick(fee)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base font-semibold truncate mb-2">{fee.title}</CardTitle>
                        <Badge variant={feeTypeVariant[fee.type]} className="w-fit text-xs">
                          {feeTypeLabels[fee.type] || fee.type}
                        </Badge>
                      </div>
                      {navigatingId === fee.id
                        ? <Loader2 className="size-4 text-muted-foreground shrink-0 mt-0.5 animate-spin" />
                        : <ChevronRight className="size-4 text-muted-foreground shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      }
                    </div>
                  </CardHeader>

                  <Separator className="mx-0" />

                  <CardContent className="pt-4 pb-3">
                    {fee.description && (
                      <p className="text-xs text-muted-foreground mb-4 line-clamp-2 leading-relaxed">{fee.description}</p>
                    )}
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">Amount</span>
                        <span className="text-sm font-semibold text-foreground">₱{fee.amount.toLocaleString()}</span>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                          <span className="font-medium">Collection Progress</span>
                          <span className="font-semibold">{fee.paidCount} / {fee.totalStudents}</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">{progress}% collected</p>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      {fee.semester ? fee.semester + " Semester" : ""}{fee.academicYear ? " · " + fee.academicYear : ""}
                    </p>
                  </CardFooter>
                </Card>
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
  )
}
