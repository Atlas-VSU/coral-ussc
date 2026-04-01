"use client";

import { DataPagination } from "@/components/organization/general/DataPagination";
import { SearchInput } from "@/components/organization/general/SearchInput";
import { StatCard } from "@/components/organization/general/StatCard";
import { StatCardsCarousel } from "@/components/organization/general/StatCardsCarousel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SelectTrigger, SelectValue, SelectContent, SelectItem, Select } from "@/components/ui/select";
import { TableHeader, TableRow, TableHead, TableBody, TableCell, Table } from "@/components/ui/table";
import { TableSkeleton } from "@/components/organization/skeleton/TableSkeleton";
import { CardGridSkeleton } from "@/components/organization/skeleton/CardGridSkeleton";
import { ViewToggle } from "@/components/organization/general/ViewToggle";
import { BulkGenerationDialog } from "@/features/organization/fines/components/BulkGenerationDialog";
import { FineType, StudentFines } from "@/features/organization/fines/types";
import { Users, AlertTriangle, Banknote, CircleDollarSign, ChevronRight, RefreshCcw, Search, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { FineBreakdownDialog } from "@/features/organization/fines/components/FineBreakdownDialog";
import { FineTypeDialog } from "@/features/organization/fines/components/FineTypeDialog";
import { useFines } from "@/features/organization/fines/hooks/useFines";
import { useFineTypes } from "@/features/organization/fines/hooks/useFineTypes";
import { getVariantFineType } from "@/features/organization/fines/utils/getVariantFineType";
import { PageHeader } from "@/components/organization/general/PageHeader";

export function FinesPage() {
  const ITEMS_PER_PAGE = 9;

  const [selectedFine, setSelectedFine] = useState<StudentFines | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkGenerateOpen, setIsBulkGenerateOpen] = useState(false);
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
  const [selectedFineType, setSelectedFineType] = useState<FineType | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [localSearch, setLocalSearch] = useState("");

  const {
    paginatedFines,
    filteredCount,
    isLoading,
    currentPage,
    setCurrentPage,
    totalPages,
    search,
    setSearch,
    filterStatus,
    handleStatusFilterChange,
    totalStudentsWithFines,
    totalUnsettled,
    totalUnpaidFines,
    totalCollectedFines,
    hardRefresh,
    setPaginatedFines,
    setTotalCount,
    setFilterStatus,
  } = useFines({ itemsPerPage: ITEMS_PER_PAGE });

  const {
    fineTypes,
    isFormSubmitting,
    fetchFineTypes,
    handleAddFineSubmission,
    handleUpdateFineType,
    handleDeleteFineType,
  } = useFineTypes();

  useEffect(() => {
    fetchFineTypes();
  }, []);

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  const openBreakdown = (fine: StudentFines) => {
    setSelectedFine(fine);
    setIsBreakdownOpen(true);
  };

  const handleAddFineType = () => {
    setSelectedFineType(null);
    setIsFormOpen(true);
  };

  const handleCreateSubmit = async (data: FineType) => {
    await handleAddFineSubmission(data);
  };

  const handleUpdateSubmit = async (fineTypeId: string, data: FineType) => {
    await handleUpdateFineType(fineTypeId, data);
  };

  const handleDeleteSubmit = async (fineTypeId: string) => {
    await handleDeleteFineType(fineTypeId);
  };

  const handleSuccess = async () => {
    const newFines = paginatedFines.filter(f => f.studentId !== selectedFine?.studentId);
    setPaginatedFines(newFines);
    setTotalCount(prev => prev - 1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(localSearch);
    setCurrentPage(1);
  };

  const handleRefresh = async () => {
    setSearch("");
    setLocalSearch("");
    setCurrentPage(1);
    setFilterStatus("all");
    await hardRefresh();
  };

  return (
    <div className="flex flex-col gap-6 pb-5 lg:pb-0">
      <PageHeader
        variant="admin"
        title="Fines Management"
        context="2nd Semester · A.Y. 2025–2026"
        description="Track and manage student fines with real-time payment status"
        action={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={handleAddFineType} className="gap-1.5">
              <FileText className="h-4 w-4" />
              View Fine Types
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <StatCardsCarousel className="grid-cols-4">
        <StatCard title="Students w/ Fines" value={totalStudentsWithFines.toLocaleString()} description="Have at least one fine" icon={Users} />
        <StatCard title="Outstanding Balance" value={`₱${totalUnpaidFines.toLocaleString()}`} description="Total unpaid amount" icon={AlertTriangle} />
        <StatCard title="Total Collected" value={`₱${totalCollectedFines.toLocaleString()}`} description="Total approved payments" icon={Banknote} />
        <StatCard title="Unsettled" value={totalUnsettled.toLocaleString()} description="Students with outstanding fines" icon={CircleDollarSign} />
      </StatCardsCarousel>

      {/* Main Card - Following Payments pattern */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
                Student Fine Records
              </CardTitle>
              <CardDescription>{filteredCount} student{filteredCount !== 1 ? 's' : ''} with active fines</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                <SearchInput
                  placeholder="Search by name or ID..."
                  value={localSearch}
                  onChange={v => setLocalSearch(v)}
                  className="w-48 sm:w-64"
                />
                <Button type="submit" variant="secondary" size="icon" disabled={isLoading}>
                  <Search className="h-4 w-4" />
                  <span className="sr-only">Search</span>
                </Button>
              </form>
              <Select value={filterStatus} onValueChange={v => { handleStatusFilterChange(v); setCurrentPage(1) }}>
                <SelectTrigger className="w-28 sm:w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleRefresh} variant="outline" disabled={isLoading}>
                <RefreshCcw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                {isLoading ? "Refreshing..." : "Refresh"}
              </Button>
              <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            viewMode === "table" ? (
              <TableSkeleton columns={7} rows={9} />
            ) : (
              <CardGridSkeleton count={9} />
            )
          ) : paginatedFines.length === 0 ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <AlertTriangle className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No fines found</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                {search || filterStatus !== "all"
                  ? "No students match your current filters. Try adjusting your search or filter criteria."
                  : "No students currently have fines. Fines will appear here when issued."}
              </p>
              {(search || filterStatus !== "all") && (
                <Button variant="outline" className="mt-4" onClick={handleRefresh}>
                  Clear Filters
                </Button>
              )}
            </div>
          ) : viewMode === "table" ? (
            <div className="rounded-md border border-border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead>Student</TableHead>
                    <TableHead className="text-center"># Fines</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                    <TableHead className="text-right hidden md:table-cell">Amount Paid</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedFines.map((fine) => {
                    const cfg = getVariantFineType(fine.status);
                    return (
                      <TableRow key={fine.id} className="border-border hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => openBreakdown(fine)}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-foreground">{fine.userName}</span>
                            <span className="text-xs text-muted-foreground">{fine.studentId}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-sm font-medium">{fine.fineItemsCount.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-sm font-medium text-foreground whitespace-nowrap">₱{fine.accumulatedAmount.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={cfg} className="capitalize text-xs whitespace-nowrap">{fine.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium text-green-600 hidden md:table-cell whitespace-nowrap">₱{fine.paidAmount.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-sm font-medium text-foreground whitespace-nowrap">₱{fine.balance.toLocaleString()}</TableCell>
                        <TableCell>
                          <ChevronRight className="size-4 text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedFines.map((fine) => {
                const cfg = getVariantFineType(fine.status);
                return (
                  <Card key={fine.studentId} className="group border-border bg-card hover:shadow-md transition-shadow cursor-pointer" onClick={() => openBreakdown(fine)}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-base font-semibold truncate">{fine.userName}</CardTitle>
                          <CardDescription className="text-xs mt-0.5">{fine.studentId}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={cfg} className="capitalize text-xs shrink-0">{fine.status}</Badge>
                          <ChevronRight className="size-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </CardHeader>
                    
                    <Separator className="mx-0" />
                    
                    <CardContent className="flex flex-col gap-3 pt-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider mb-1"># Fines</p>
                          <p className="text-sm font-semibold text-foreground">{fine.fineItemsCount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Amount</p>
                          <p className="text-sm font-semibold text-foreground">₱{fine.accumulatedAmount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Amount Paid</p>
                          <p className="text-sm font-semibold text-green-600">₱{fine.paidAmount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Balance</p>
                          <p className="text-sm font-semibold text-foreground">₱{fine.balance.toLocaleString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {paginatedFines.length > 0 && (
            <DataPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredCount}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          )}
        </CardContent>
      </Card>

      <FineTypeDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        fineTypes={fineTypes}
        onAddFineType={handleCreateSubmit}
        onUpdateFineType={handleUpdateSubmit}
        onDeleteFineType={handleDeleteSubmit}
        isProcessing={isFormSubmitting}
        fetchFineTypes={fetchFineTypes}
      />

      <BulkGenerationDialog
        open={isBulkGenerateOpen}
        onOpenChange={setIsBulkGenerateOpen}
      />
      <FineBreakdownDialog
        open={isBreakdownOpen}
        onOpenChange={setIsBreakdownOpen}
        fines={selectedFine}
        onSuccess={() => handleSuccess()}
      />
    </div>
  );
}
