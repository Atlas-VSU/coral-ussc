"use client";

import { DataPagination } from "@/features/organization/fines/components/DataPagination";
import { SearchInput } from "@/features/organization/fines/components/SearchInput";
import { StatCard } from "@/features/organization/fines/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SelectTrigger, SelectValue, SelectContent, SelectItem, Select } from "@/components/ui/select";
import { TableHeader, TableRow, TableHead, TableBody, TableCell, Table } from "@/components/ui/table";
import { ViewToggle } from "@/features/organization/fines/components/ViewToggle";
import { BulkGenerationDialog } from "@/features/organization/fines/components/BulkGenerationDialog";
import { FinesHeader } from "@/features/organization/fines/components/FinesHeader";
import { FineTypeForm } from "@/features/organization/fines/components/FineTypeForm";
import { FineType, StudentFines } from "@/features/organization/fines/types";
import { createFineType } from "@/firebase/fines/create/fineType";
import { Users, AlertTriangle, Banknote, CircleDollarSign, ChevronRight, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { countFinesOfStudents, countStudentsWithFines, countUnsettleFinesOfStudents, getAllFines } from "@/firebase/fines/read/fines";
import { FineBreakdownDialog } from "@/features/organization/fines/components/FineBreakdownDialog";

export default function FinesPage() {

  const [allFines, setAllFines] = useState<StudentFines[]>([]);
  const [selectedFine, setSelectedFines] = useState<StudentFines | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkGenerateOpen, setIsBulkGenerateOpen] = useState(false);
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [selectedFineType, setSelectedFineType] = useState<FineType | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("paid");
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [totalStudentsWithFines, setTotalStudentsWithFines] = useState(0);
  const [totalUnsettled, setTotalUnsettled] = useState(0);
  const [isStatusChanging, setIsStatusChanging] = useState(true);

  // Initialize stats
  const initialize = async () => {
    try {
      let count = await countStudentsWithFines();
      setTotalStudentsWithFines(count);
      count = await countUnsettleFinesOfStudents();
      setTotalUnsettled(count);
    } catch (error) {
      console.error("Failed to fetch total count of students with fines:", error);
    }
  };

  // Fetch ALL fines once (or when status filter changes)
  const fetchAll = useCallback(async (status: string) => {
    setIsLoading(true);
    try {
      const docs = await getAllFines(status);
      setAllFines(docs);
      setCurrentPage(1); // always reset to page 1 on new fetch
    } catch (error) {
      console.error("Failed to fetch fines:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {

      if (isStatusChanging) {
      setIsStatusChanging(false);
      initialize();
      }
        
      fetchAll(filterStatus);
    
   }, [ filterStatus]);


  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Filter in memory (search + status already filtered at fetch level) 
  const filtered = useMemo(() => {
    if (!search.trim()) return allFines;
    const q = search.toLowerCase();
    return allFines.filter(f =>
      f.userName.toLowerCase().includes(q) ||
      f.studentId.toLowerCase().includes(q)
    );
  }, [allFines, search]);

  // Client-side pagination 
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated  = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Helpers 
  const getVariant = (status: string) => {
    switch (status) {
      case "pending":  return "outline";
      case "partial":  return "outline";
      case "paid":     return "secondary";
      case "waived":   return "outline";
      case "unpaid":   return "destructive";
      default:         return "outline";
    }
  };

  const openBreakdown = (fine: StudentFines) => {
    setSelectedFines(fine);
    setIsBreakdownOpen(true);
  };

  // Handlers 
  const handleAddFineType = () => {
    setSelectedFineType(null);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: FineType) => {
    setIsFormSubmitting(true);
    try {
      await createFineType(data);
      toast.success("A type of fine was added successfully");
    } catch (error) {
      toast.error(selectedFineType ? "Failed to update fine type" : "Failed to add fine type");
    } finally {
      setIsFormSubmitting(false);
      setIsFormOpen(false);
      setSelectedFineType(null);
    }
  };

  const handleSuccess = () => {
    setIsStatusChanging(true);
    setFilterStatus("paid")
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <FinesHeader
          onAddFineType={handleAddFineType}
          onBulkGenerate={() => setIsBulkGenerateOpen(true)}
        />

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard title="Students w/ Fines" value={totalStudentsWithFines} description="Have at least one fine" icon={Users} />
          {/* <StatCard title="Outstanding Balance" value={`₱${999}`} description="Total unpaid amount" icon={AlertTriangle} />
          <StatCard title="Total Collected" value={`₱${999}`} description="Total approved payments" icon={Banknote} /> */}
          <StatCard title="Unsettled" value={totalUnsettled} description="Students with outstanding fines" icon={CircleDollarSign} />
        </div>

        <Card className="border-border">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base text-foreground">Student Fine Records</CardTitle>
                {/* filtered.length reflects search results; allFines.length is the unfiltered total */}
                <CardDescription className="text-muted-foreground">
                  {filtered.length} student(s) found
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <SearchInput
                  placeholder="Search by name or ID..."
                  value={search}
                  onChange={v => setSearch(v)}
                  className="w-64"
                />
                <Select value={filterStatus} onValueChange={(v: string) => {
                  setFilterStatus(v);
                  setSearch("");      // clear search when switching status
                }}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="waived">Waived</SelectItem>
                  </SelectContent>
                </Select>
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
              Page {currentPage} of {totalPages || 1} · {paginated.length} records shown
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Loading…
              </div>
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
                      {paginated.map((fine) => {        {/* ← paginated, not fines */}
                        const cfg = getVariant(fine.status);
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
                      {paginated.length === 0 && (
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
                  totalItems={filtered.length}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={setCurrentPage}
                />
              </>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {paginated.map((fine) => {         {/* ← paginated, not fines */}
                    const cfg = getVariant(fine.status);
                    return (
                      <Card key={fine.studentId} className="border-border">
                        <CardContent className="flex flex-col gap-3 p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground">{fine.userName}</p>
                              <p className="text-xs text-muted-foreground">{fine.studentId}</p>
                            </div>
                            <div className="flex flex-wrap justify-end gap-1 shrink-0">
                              <Badge variant={getVariant(fine.status)} className="capitalize">{fine.status}</Badge>
                              {/* {badges.waivedCount > 0 && (
                                <Badge variant="outline" className="text-xs">
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
                              )} */}
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
                  {paginated.length === 0 && (
                    <div className="col-span-full py-8 text-center text-sm text-muted-foreground">
                      No records found.
                    </div>
                  )}
                </div>

                {/* ── Client-side pagination ── */}
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

        <FineTypeForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={handleFormSubmit}
          fineType={selectedFineType}
          isSubmitting={isFormSubmitting}
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