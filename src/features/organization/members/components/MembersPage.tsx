"use client";

import { useState } from "react";
import {
  Member,
  MemberData,
  BulkImportResult,
} from "@/features/organization/members/types";
import { MemberForm } from "@/features/organization/members/components/MemberForm";
import { DeleteConfirmationDialog } from "@/features/organization/members/components/DeleteConfirmationDialog";
import { BulkImportDialog } from "@/features/organization/members/components/BulkImportDialog";
import { MembersList } from "@/features/organization/members/components/MembersList";
import { MembersTable } from "@/features/organization/members/components/MembersTable";
import { MembersSkeleton } from "@/features/organization/members/components/MembersSkeleton";
import { MembersFilters } from "@/features/organization/members/components/MembersFilters";
import { MembersPagination } from "@/features/organization/members/components/MembersPagination";
import { ViewMode } from "./ViewToggle";
import { PageHeader } from "@/components/organization/general/PageHeader";
import {
  addUser,
  checkStudentIdExist,
  checkEmailExist,
  deleteUser,
  getCurrentUserData,
  processFileForBulkImport,
  updateUser,
} from "@/firebase";
import { toast } from "sonner";
import { BulkImportResultModal } from "@/features/organization/members/components/BulkImportResultModal";
import { usePaginatedMembers } from "@/features/organization/members/hooks/usePaginatedMembers";
import { getAllOrgs } from "@/firebase/organization";
import { onboardNewStudent } from "@/firebase/onboarding";
import { resolveStudentIdentity, type StudentIdentityResolution } from "@/firebase/users";
import { restoreStudentRecord } from "@/firebase/restore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  Upload,
  UserPlus,
} from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { SelfRegisteredTab } from "@/features/organization/members/components/SelfRegisteredTab";
import { useSelfRegistrations } from "@/features/organization/members/hooks/useSelfRegistrations";

export function MembersPage() {
  const {
    registrations: selfRegistrations,
    pendingCount: selfRegPendingCount,
    processing: selfRegProcessing,
    accept: acceptSelfRegistration,
    reject: rejectSelfRegistration,
  } = useSelfRegistrations();

  const {
    members,
    faculties,
    programs,
    totalMembers,
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    term,
    goToNextPage,
    goToPrevPage,
    programFilter,
    sortBy,
    viewMode,
    isLoading,
    isRefreshing,
    isSearchActive,
    searchInput,
    handleSearchInputChange,
    handleSearchCommit,
    clearSearch,
    handleProgramFilter,
    handleSortBy,
    handleViewModeChange,
    refreshData,
  } = usePaginatedMembers();

  // ─── Local UI state ──────────────────────────────────────────────────────
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isBulkImportOpenResult, setIsBulkImportOpenResult] = useState(false);
  const [bulkImportResult, setBulkImportResult] = useState<BulkImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberData | null>(null);
  // Set when a submitted Student ID belongs to a retired record — prompts a
  // restore instead of creating a duplicate document for the same student.
  const [archivedMatch, setArchivedMatch] = useState<{
    resolution: Extract<StudentIdentityResolution, { status: "archived" }>;
    data: Member;
  } | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [value, setValue] = useState("");

  // ─── Member actions ───────────────────────────────────────────────────────
  const handleAddMember = () => {
    setSelectedMember(null);
    setIsFormOpen(true);
  };

  const handleEditMember = (member: MemberData) => {
    setSelectedMember(member);
    setIsFormOpen(true);
  };

  const handleDeleteMember = (member: MemberData) => {
    setSelectedMember(member);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedMember || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteUser(selectedMember.id);
      toast.success("Member deleted successfully");
      refreshData();
    } catch (error) {
      toast.error("Failed to delete member");
      console.error(error);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setSelectedMember(null);
    }
  };

  const handleFormSubmit = async (data: Member) => {
    setIsFormSubmitting(true);
    try {
      if (selectedMember) {
        await updateUser(selectedMember.id, data);
        toast.success("Member updated successfully");
      } else {
        const identity = await resolveStudentIdentity(data.studentId);

        if (identity.status === "active") {
          toast.error("Student ID already exists. Please use a different one.");
          return;
        }

        // A retired record still holds this Student ID. Adding a second one
        // would strand their fees, fines and clearance on the dead document
        // and charge them twice — prompt to restore the original instead.
        if (identity.status === "archived") {
          setArchivedMatch({ resolution: identity, data });
          return;
        }

        if (await checkEmailExist(data.email)) {
          toast.error("Email already exists. Please use a different one.");
          return;
        }

        const userId = await addUser(data);
        const currentUser = (await getCurrentUserData()) as unknown as Member;

        if (data.role === "user" && userId) {
          const allOrgs = await getAllOrgs();
          await onboardNewStudent(userId, data, allOrgs, currentUser);
        }
        toast.success("Member added successfully");
      }
      refreshData();
    } catch (error) {
      toast.error(
        selectedMember ? "Failed to update member" : "Failed to add member",
      );
      console.error(error);
    } finally {
      setIsFormSubmitting(false);
      setIsFormOpen(false);
      setSelectedMember(null);
    }
  };

  /**
   * Brings back the retired record this Student ID belongs to.
   *
   * Deliberately does NOT call `onboardNewStudent`: onboarding backfills a
   * fresh set of fees and fines, which would stack on top of the ones being
   * reinstated and double-charge the student.
   */
  const handleRestoreArchived = async () => {
    if (!archivedMatch) return;
    const { resolution, data } = archivedMatch;
    setIsFormSubmitting(true);
    try {
      const result = await restoreStudentRecord(resolution.docId, data.studentId, {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        programId: data.programId,
        facultyId: data.facultyId,
        yearLevel: data.yearLevel,
      });
      toast.success(
        `Record restored — ${result.feesRestored} fee(s), ${result.finesRestored} fine(s) and ` +
        `${result.clearanceRestored} clearance record(s) brought back.`
      );
      if (result.skippedForeignArchives > 0) {
        toast.warning(
          `${result.skippedForeignArchives} record(s) stayed archived because they were archived ` +
          `manually, not by a roster sync. Review them if they should be visible.`
        );
      }
      refreshData();
    } catch (error) {
      toast.error("Failed to restore this record");
      console.error(error);
    } finally {
      setIsFormSubmitting(false);
      setArchivedMatch(null);
    }
  };

  const handleBulkImport = async (file: File) => {
    setIsImporting(true);
    try {
      const result = (await processFileForBulkImport(file, (progress) => {
        setImportProgress(
          (progress.processedCount / progress.totalCount) * 100,
        );
        setCurrentBatch(progress.currentBatch);
        setTotalBatches(progress.totalBatches);
        setTotalStudents(progress.totalCount);
      })) as BulkImportResult;
      setBulkImportResult(result);
      setIsBulkImportOpen(false);
      setIsBulkImportOpenResult(true);
      refreshData();
    } catch (error) {
      console.error("Bulk import failed:", error);
      toast.error("Failed to process the file. Please try again.");
    } finally {
      setIsImporting(false);
      setImportProgress(0);
      setCurrentBatch(0);
      setTotalBatches(0);
      setTotalStudents(0);
    }
  };

  const isBusy = isLoading || isRefreshing;

  return (
    <div className="flex flex-col gap-6 pb-5 lg:pb-0">
      <PageHeader
        variant="admin"
        title="Members"
        context={`${term.semester} Semester · A.Y. ${term.AY}`}
        description={`${totalMembers} total member${totalMembers !== 1 ? "s" : ""} in your organization`}
        action={
          <div className="hidden lg:flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={isBusy}
            >
              <RefreshCcw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsBulkImportOpen(true)}
            >
              <Upload className="mr-2 h-4 w-4" />
              Bulk Import
            </Button>
            <Button size="sm" onClick={handleAddMember}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </div>
        }
      />

      <Select
        value={value}
        onValueChange={(value) => {
          switch (value) {
            case "refresh":
              refreshData();
              break;
            case "bulk-import":
              setIsBulkImportOpen(true);
              break;
            case "add-member":
              handleAddMember();
              break;
          }
          setValue("")
        }}

        
      >
        <SelectTrigger className="lg:hidden w-full">
          <SelectValue placeholder="Actions" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="refresh" disabled={isBusy}>
            <div className="flex items-center">
              <RefreshCcw
                className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </div>
          </SelectItem>

          <SelectItem value="bulk-import">
            <div className="flex items-center">
              <Upload className="mr-2 h-4 w-4" />
              Bulk Import
            </div>
          </SelectItem>

          <SelectItem value="add-member">
            <div className="flex items-center">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Member
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Tabs — All members vs. self-registered students awaiting verification */}
      <Tabs defaultValue="all" className="w-full gap-6">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="all">All Members</TabsTrigger>
          <TabsTrigger value="verify" className="gap-2">
            Self-Registered
            {selfRegPendingCount > 0 && (
              <Badge
                variant="secondary"
                className="bg-amber-100 text-amber-700 px-1.5"
              >
                {selfRegPendingCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="flex flex-col gap-6">
          {/* Filters — search wired to Enter-only commit */}
          <MembersFilters
            programs={programs}
            searchTerm={searchInput}
            onSearchChange={handleSearchInputChange}
            onSearchCommit={handleSearchCommit}
            onSearchClear={clearSearch}
            onProgramFilter={handleProgramFilter}
            onSortBy={handleSortBy}
            programFilter={programFilter}
            disabled={isBusy}
            viewMode={viewMode}
            onViewChange={handleViewModeChange}
          />

          {/* Member list */}
          {isLoading ? (
            <MembersSkeleton viewMode={viewMode} />
          ) : viewMode === "card" ? (
            <MembersList
              members={members}
              programs={programs}
              faculties={faculties}
              onEdit={handleEditMember}
              onDelete={handleDeleteMember}
            />
          ) : (
            <MembersTable
              members={members}
              programs={programs}
              faculties={faculties}
              onEdit={handleEditMember}
              onDelete={handleDeleteMember}
            />
          )}

          {/* Prev / Next pagination — no page jumping */}
          {!isBusy && members.length > 0 && (
            <div className="flex items-center justify-between px-1 mb-4">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
                {isSearchActive && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    · searching "{searchInput}"
                  </span>
                )}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPrevPage}
                  disabled={!hasPrevPage || isBusy}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={!hasNextPage || isBusy}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="verify">
          <SelfRegisteredTab
            registrations={selfRegistrations}
            processing={selfRegProcessing}
            onAccept={acceptSelfRegistration}
            onReject={rejectSelfRegistration}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <MemberForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        member={selectedMember}
        facultyData={faculties}
        programData={programs}
        isSubmitting={isFormSubmitting}
      />

      <AlertDialog
        open={!!archivedMatch}
        onOpenChange={(open) => !open && setArchivedMatch(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>This student already has a retired record</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">
                    {archivedMatch?.resolution.member.firstName}{" "}
                    {archivedMatch?.resolution.member.lastName}
                  </span>{" "}
                  ({archivedMatch?.resolution.member.studentId}) was removed when the roster was
                  last synchronized.
                </p>
                <p>
                  Restoring brings back their existing fees, fines and clearance for this term.
                  Adding them as a new member instead would leave that history stranded on the old
                  record and charge them twice.
                </p>
                <p>If this is a different person, cancel and correct the Student ID.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isFormSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestoreArchived} disabled={isFormSubmitting}>
              {isFormSubmitting ? "Restoring..." : "Restore Record"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />

      <BulkImportDialog
        open={isBulkImportOpen}
        onOpenChange={setIsBulkImportOpen}
        onImport={handleBulkImport}
        isImporting={isImporting}
        totalStudents={totalStudents}
        batchSize={200}
        importProgress={importProgress}
        currentBatch={currentBatch}
        totalBatches={totalBatches}
      />

      <BulkImportResultModal
        open={isBulkImportOpenResult}
        onOpenChange={setIsBulkImportOpenResult}
        result={bulkImportResult}
      />
    </div>
  );
}
