"use client";

import { DataPagination } from "@/components/organization/general/DataPagination";
import { StatCard } from "@/components/organization/general/StatCard";
import { StatCardsCarousel } from "@/components/organization/general/StatCardsCarousel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Table,
} from "@/components/ui/table";
import { BulkGenerationDialog } from "@/features/organization/fines/components/BulkGenerationDialog";
import { FineType, StudentFines } from "@/features/organization/fines/types";
import {
  Users,
  AlertTriangle,
  Banknote,
  CircleDollarSign,
  ChevronRight,
  FileText,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/organization/skeleton/TableSkeleton";
import { CardGridSkeleton } from "@/components/organization/skeleton/CardGridSkeleton";
import React, { useState, useEffect } from "react";
import { FineBreakdownDialog } from "@/features/organization/fines/components/FineBreakdownDialog";
import { FineTypeDialog } from "@/features/organization/fines/components/FineTypeDialog";
import { FinesFilters } from "@/features/organization/fines/components/FinesFilters";
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
  const [selectedFineType, setSelectedFineType] = useState<FineType | null>(
    null,
  );
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [searchTerm, setSearchTerm] = useState("");

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
    refreshFineItems,
    AY,sem,
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
    setSearchTerm(search);
  }, [search]);

  const handleSearchCommit = () => {
    setSearch(searchTerm);
    setCurrentPage(1);
  };

  const handleSearchClear = () => {
    setSearchTerm("");
    setSearch("");
    setCurrentPage(1);
  };

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
    const newFines = paginatedFines.filter(
      (f) => f.studentId !== selectedFine?.studentId,
    );
    setPaginatedFines(newFines);
    refreshFineItems();
    setTotalCount((prev) => prev - 1);
  };

  return (
    <div className="flex flex-col gap-6 pb-5 lg:pb-0">
      <PageHeader
        variant="admin"
        title="Fines Management"
        context={`${sem} Semester · A.Y. ${AY}`}
        description="Track and manage student fines with real-time payment status"
        action={
          <div className="hidden lg:flex">
            {/* PLEASE DON'T REMOVE THIS YET */}
            {/* NOTE: THIS IS THE BUTTON TO TRIGGER BULK GENERATION OF FINES CONTAINER FOR ALL STUDENTS OR MEMBERS THAT ARE ALREADY ADDED IN THE DATABASE */}
            {/* USING THIS MEANS A BRUTEFORCE SINCE A FINES CONTAINER SHOULD BE MADE TOGETHER WITH THE CLEARANCE AS SOON AS A STUDENT WAS ADDED TO THE SYSTEM */}
            {/* <Button size="sm" onClick={() => setIsBulkGenerateOpen(true)}>
              Seed Fines to All Users
            </Button> */}
            
            <Button size="sm" onClick={handleAddFineType} className="gap-1.5">
              <Eye className="h-4 w-4" />
              View Fine Types
            </Button>
          </div>
        }
      />

      <Button
        size="sm"
        onClick={handleAddFineType}
        className="lg:hidden w-full"
      >
        <Eye className="h-4 w-4" />
        View Fine Types
      </Button>

      {/* Stats */}
      <StatCardsCarousel className="grid-cols-4">
        <StatCard
          title="Students w/ Fines"
          value={totalStudentsWithFines.toLocaleString()}
          description="Have at least one fine"
          icon={Users}
          variant="info"
        />
        <StatCard
          title="Outstanding Balance"
          value={`₱${totalUnpaidFines.toLocaleString()}`}
          description="Total unpaid amount"
          icon={AlertTriangle}
          variant="danger"
        />
        <StatCard
          title="Total Collected"
          value={`₱${totalCollectedFines.toLocaleString()}`}
          description="Total approved payments"
          icon={Banknote}
          variant="success"
        />
        <StatCard
          title="Unsettled"
          value={totalUnsettled.toLocaleString()}
          description="Students with outstanding fines"
          icon={CircleDollarSign}
          variant="warning"
        />
      </StatCardsCarousel>

      {/* Filters Section */}
      <FinesFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearchCommit={handleSearchCommit}
        onSearchClear={handleSearchClear}
        statusFilter={filterStatus}
        onStatusChange={(v) => {
          handleStatusFilterChange(v);
          setCurrentPage(1);
        }}
        viewMode={viewMode}
        onViewChange={setViewMode}
        onRefresh={hardRefresh}
        disabled={isLoading}
      />

      {/* Main Card - Following Payments pattern */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
                Student Fine Records
              </CardTitle>
              <CardDescription>
                {filteredCount} student{filteredCount !== 1 ? "s" : ""} with
                active fines
              </CardDescription>
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
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={handleSearchClear}
                >
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
                    <TableHead className="text-right hidden md:table-cell">
                      Amount Paid
                    </TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedFines.map((fine) => {
                    const cfg = getVariantFineType(fine.status);
                    return (
                      <TableRow
                        key={fine.id}
                        className="border-border hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => openBreakdown(fine)}
                      >
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
                              {fine.userName}
                            </span>
                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {fine.studentId}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-sm font-medium">
                          {fine.fineItemsCount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium text-foreground whitespace-nowrap">
                          ₱{fine.accumulatedAmount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={cfg}
                            className="capitalize text-xs whitespace-nowrap"
                          >
                            {fine.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium text-green-600 hidden md:table-cell whitespace-nowrap">
                          ₱{fine.paidAmount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium text-foreground whitespace-nowrap">
                          ₱{fine.balance < 0 ? "0" : fine.balance.toLocaleString()}
                        </TableCell>
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
                  <React.Fragment key={fine.id}>
                    {/* Mobile Layout (< md) */}
                    <Card
                      className="md:hidden group hover:shadow-md active:shadow-sm transition-all duration-200 border-border bg-card overflow-hidden cursor-pointer"
                      onClick={() => openBreakdown(fine)}
                    >
                      <CardContent className="p-0">
                        <div className="w-full p-3 flex items-center gap-3 text-left active:bg-muted/50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-sm text-foreground w-[200px] truncate">
                                {fine.userName}
                              </h3>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge variant={cfg} className="capitalize text-xs px-1.5 py-0.5">
                                {fine.status}
                              </Badge>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">{fine.studentId}</span>
                            </div>
                          </div>
                          <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                        </div>
                        
                        <div className="overflow-hidden">
                          <div className="px-3 pb-3 space-y-2 border-t border-border pt-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Total</span>
                              <span className="font-semibold text-foreground">₱{fine.accumulatedAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Paid</span>
                              <span className="font-semibold text-green-600">₱{fine.paidAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Balance</span>
                              <span className="font-semibold text-foreground">₱{fine.balance < 0 ? "0" : fine.balance.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs pt-1">
                              <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="text-muted-foreground">
                                {fine.fineItemsCount.toLocaleString()} fine{fine.fineItemsCount !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Desktop Layout (>= md) */}
                    <Card
                      className="hidden md:flex group border-border bg-card hover:shadow-lg transition-all duration-300 cursor-pointer h-full flex-col overflow-hidden"
                      onClick={() => openBreakdown(fine)}
                    >
                      <CardHeader className="px-5 pt-5 pb-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              <Badge
                                variant={cfg}
                                className="capitalize text-xs px-2.5 py-1"
                              >
                                {fine.status}
                              </Badge>
                            </div>
                            <CardTitle className="text-base font-bold text-foreground leading-tight max-w-[200px] truncate">
                              {fine.userName}
                            </CardTitle>
                            <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
                              <span>{fine.studentId}</span>
                            </div>
                          </div>
                          <ChevronRight className="size-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </CardHeader>

                      <div className="border-t border-border mx-5" />

                      <CardContent className="px-5 py-4 flex-1 flex flex-col gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center shrink-0">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                              # Fines
                            </p>
                            <p className="text-sm font-semibold text-foreground">
                              {fine.fineItemsCount.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center shrink-0">
                            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                              Total Amount
                            </p>
                            <p className="text-sm font-semibold text-foreground">
                              ₱{fine.accumulatedAmount.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center shrink-0">
                            <Banknote className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                              Amount Paid
                            </p>
                            <p className="text-sm font-semibold text-green-600">
                              ₱{fine.paidAmount.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center shrink-0">
                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                              Balance
                            </p>
                            <p className="text-sm font-semibold text-foreground">
                              ₱{fine.balance.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </React.Fragment>
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
