"use client";

import { DataPagination } from "@/features/organization/fines/components/DataPagination";
import { SearchInput } from "@/features/organization/fines/components/SearchInput";
import { StatCard } from "@/features/organization/fines/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SelectTrigger, SelectValue, SelectContent, SelectItem, Select } from "@/features/organization/fines/local-components/Select";

import { TableHeader, TableRow, TableHead, TableBody, TableCell, Table } from "@/components/ui/table";
import { TableSkeleton, CardGridSkeleton } from "@/components/organization/Skeletons";
import { ViewToggle } from "@/features/organization/fines/components/ViewToggle";
import { BulkGenerationDialog } from "@/features/organization/fines/components/BulkGenerationDialog";
import { FinesHeader } from "@/features/organization/fines/components/FinesHeader";
import { FineTypeForm } from "@/features/organization/fines/components/FineTypeForm";
import { FineType, StudentFines } from "@/features/organization/fines/types";
import { createFineType, deleteFineType, updateFineType } from "@/firebase/fines/create/fineType";
import { Users, AlertTriangle, Banknote, CircleDollarSign, ChevronRight, Eye, RefreshCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
// import { StatCard } from "@/features/organization/fees/local-components/StatCard";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { countFinesOfStudents, countStudentsWithFines, countUnsettleFinesOfStudents, getAllFines } from "@/firebase/fines/read/fines";
import { FineBreakdownDialog } from "@/features/organization/fines/components/FineBreakdownDialog";
import { usePaymentApproval } from "@/features/organization/payments/hooks/usePaymentApproval";
import { FineTypeDialog } from "@/features/organization/fines/components/FineTypeDialog";
import { useFines } from "@/features/organization/fines/hooks/useFines";
import { useFineTypes } from "@/features/organization/fines/hooks/useFineTypes";
import { getVariantFineType } from "@/features/organization/fines/utils/getVariantFineType";

export default function FinesPage() {
  const ITEMS_PER_PAGE = 10;
  
  const [selectedFine, setSelectedFine] = useState<StudentFines | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkGenerateOpen, setIsBulkGenerateOpen] = useState(false);
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
  const [selectedFineType, setSelectedFineType] = useState<FineType | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");

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
    // markStatusChanged,
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


  const openBreakdown = (fine: StudentFines) => {
    setSelectedFine(fine);
    setIsBreakdownOpen(true);
  };

  // Handlers 
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
    // markStatusChanged();
  };

  return (
    <div className="min-h-screen">
      <div className="flex flex-col gap-6 max-w-7xl mx-auto sm:px-6 lg:px-8 py-8">

        <FinesHeader
          onAddFineType={handleAddFineType}
          onBulkGenerate={() => setIsBulkGenerateOpen(true)}
          onRefresh={hardRefresh}
          isLoading={isLoading}
        />

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          <StatCard title="Students w/ Fines" value={totalStudentsWithFines} description="Have at least one fine" icon={Users} />
          <StatCard title="Outstanding Balance" value={`₱${totalUnpaidFines}`} description="Total unpaid amount" icon={AlertTriangle} />
          <StatCard title="Total Collected" value={`₱${totalCollectedFines}`} description="Total approved payments" icon={Banknote} />
          <StatCard title="Unsettled" value={totalUnsettled} description="Students with outstanding fines" icon={CircleDollarSign} />
        </div>

        <Card className="border-border">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base text-foreground">Student Fine Records</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {filteredCount} student(s) found
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <SearchInput
                  placeholder="Search by name or ID..."
                  value={search}
                  onChange={v => setSearch(v)}
                  className="w-64"
                />
                <Select value={filterStatus} onValueChange={handleStatusFilterChange}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    {/* <SelectItem value="waived">Waived</SelectItem> */}
                  </SelectContent>
                </Select>
                <Button onClick={hardRefresh} variant="outline" size="lg" disabled={isLoading}>
                  <RefreshCcw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  {isLoading ? 'Refreshing...' : 'Refresh'}
                </Button>
                {/* <Select value={filterAppeal} onValueChange={(v: string) => { setFilterAppeal(v); setCurrentPage(1) }}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Appeals" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Appeals</SelectItem>
                    <SelectItem value="any">Has Appeal</SelectItem>
                    <SelectItem value="pending">Appeal Pending</SelectItem>
                    <SelectItem value="approved">Appeal Approved</SelectItem>
                    <SelectItem value="rejected">Appeal Rejected</SelectItem>
                    <SelectItem value="none">No Appeal</SelectItem>
                  </SelectContent>
                </Select> */}
                <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
              </div>
            </div>
            <CardDescription className="text-muted-foreground">
              Page {currentPage} of {totalPages || 1} · {paginatedFines.length} records shown
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isLoading ? (
            viewMode === "table" ? (
              <TableSkeleton columns={7} rows={10} />
            ) : (
              <CardGridSkeleton count={6} />
            )
          ) : viewMode === "table" ? (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead>Student</TableHead>
                        <TableHead className="text-center"># Fines</TableHead>
                        <TableHead className="text-right">Total Amount</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                        <TableHead className="text-right">Amount Paid</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedFines.map((fine) => {
                        const cfg = getVariantFineType(fine.status);
                        return (
                          <TableRow key={fine.id}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-foreground">{fine.userName}</span>
                                <span className="text-xs text-muted-foreground">{fine.studentId}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center text-sm">{fine.fineItemsCount.toLocaleString()}</TableCell>
                            <TableCell className="text-right text-sm font-medium">₱{fine.accumulatedAmount.toLocaleString()}</TableCell>
                            <TableCell className="text-right text-sm font-medium">
                              <Badge variant={cfg} className="capitalize">{fine.status}</Badge>
                              {/* <div className="flex flex-wrap gap-1">
                                <Badge variant={fine.status} className="capitalize">{fine.status}</Badge>
                                {badges.waivedCount > 0 && (
                                  <Badge variant="outline" className="text-xs gap-1">
                                    {badges.waivedCount} Waived
                                  </Badge>
                                )}
                                {badges.pendingAppeals > 0 && (
                                  <Badge variant="default" className="text-xs">
                                    {badges.pendingAppeals} Appeal{badges.pendingAppeals !== 1 ? "s" : ""} Pending
                                  </Badge>
                                )}
                                {badges.rejectedAppeals > 0 && (
                                  <Badge variant="destructive" className="text-xs">
                                    {badges.rejectedAppeals} Appeal{badges.rejectedAppeals !== 1 ? "s" : ""} Rejected
                                  </Badge>
                                )}
                              </div> */}
                            </TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground">₱{fine.paidAmount.toLocaleString()}</TableCell>
                            <TableCell className="text-right text-sm font-medium">₱{fine.balance.toLocaleString()}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm" variant="outline"
                                className="gap-1.5 text-xs"
                                onClick={() => openBreakdown(fine)}
                              >
                                <Eye className="size-3.5" /> View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {paginatedFines.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                            No records found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* ── Client-side pagination ── */}
                <DataPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredCount}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={setCurrentPage}
                />
              </>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {paginatedFines.map((fine) => {
                    const cfg = getVariantFineType(fine.status);
                    return (
                      <Card key={fine.studentId} className="border-border">
                        <CardContent className="flex flex-col gap-3 p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground">{fine.userName}</p>
                              <p className="text-xs text-muted-foreground">{fine.studentId}</p>
                            </div>
                            <div className="flex flex-wrap justify-end gap-1 shrink-0">
                              <Badge variant={getVariantFineType(fine.status)} className="capitalize">{fine.status}</Badge>
                            </div>
                          </div>
                          <Separator />
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <p className="text-muted-foreground"># Fines</p>
                              <p className="font-medium">{fine.fineItemsCount.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Total Amount</p>
                              <p className="font-medium">₱{fine.accumulatedAmount.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Amount Paid</p>
                              <p className="font-medium">₱{fine.paidAmount.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Balance</p>
                              <p className="font-medium">₱{fine.balance.toLocaleString()}</p>
                            </div>
                          </div>
                          <Button
                            size="sm" variant="outline"
                            className="mt-1 w-full gap-1.5 text-xs"
                            onClick={() => openBreakdown(fine)}
                          >
                            <Eye className="size-3.5" /> View Details
                            <ChevronRight className="ml-auto size-3.5" />
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                  {paginatedFines.length === 0 && (
                    <div className="col-span-full py-8 text-center text-sm text-muted-foreground">
                      No records found.
                    </div>
                  )}
                </div>

                {/* ── Client-side pagination ── */}
                <DataPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredCount}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={setCurrentPage}
                />
              </>
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
          onSuccess={() => handleSuccess() }
        />
      </div>
    </div>
  );
}