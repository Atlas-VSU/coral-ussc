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
import { MembersHeader } from "@/features/organization/members/components/MembersHeader";
import { MembersFilters } from "@/features/organization/members/components/MembersFilters";
import { MembersPagination } from "@/features/organization/members/components/MembersPagination";
import { ViewMode } from "@/features/organization/members/components/ViewToggle";
import {
  addStudentWithClearance,
  addUser,
  checkStudentIdExist,
  deleteUser,
  getCurrentUserData,
  hardDeleteUsers,
  processFileForBulkImport,
  updateUser,
} from "@/firebase";
import { toast } from "sonner";
import { BulkImportResultModal } from "@/features/organization/members/components/BulkImportResultModal";
import { usePaginatedMembers } from "@/features/organization/members/hooks/usePaginatedMembers";
import { createFinePerStudent } from "@/firebase/fines/create/fines";
import { Button } from "@/components/ui/button";

export default function MembersPage() {
  const {
    members,
    faculties,
    programs,
    totalMembers,
    totalPages,
    currentPage,
    searchQuery,
    programFilter,
    viewMode,
    isLoading,
    isRefreshing,
    isSearchActive,
    performSearch,
    handleSearch,
    handleProgramFilter,
    handleSortBy,
    handlePageChange,
    handleViewModeChange,
    refreshData,
  } = usePaginatedMembers();

  // Local UI state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isBulkImportOpenResult, setIsBulkImportOpenResult] = useState(false);
  const [bulkImportResult, setBulkImportResult] =
    useState<BulkImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberData | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);

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
    if (selectedMember && !isDeleting) {
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
    }
  };

  const handleFormSubmit = async (data: Member) => {
    setIsFormSubmitting(true);
    try {
      if (selectedMember) {
        await updateUser(selectedMember.id, data);
        toast.success("Member updated successfully");
      } else {
        if (await checkStudentIdExist(data.studentId)) {
          toast.error("Student ID already exists. Please use a different one.");
          return;
        }
        const userId = await addUser(data);
        const currentUser = await getCurrentUserData() as unknown as Member;
        if (data.role === "user" && userId) {
          await addStudentWithClearance(userId, data, currentUser.id!);
          await createFinePerStudent(userId,data); 
        }
        toast.success("Member added successfully");
      }
      refreshData();
    } catch (error) {
      toast.error(
        selectedMember ? "Failed to update member" : "Failed to add member"
      );
      console.error(error);
    } finally {
      setIsFormSubmitting(false);
      setIsFormOpen(false);
      setSelectedMember(null);
    }
  };

  const handleBulkImport = async (file: File) => {
    setIsImporting(true);
    try {
      const result = (await processFileForBulkImport(file, (progress) => {
        setImportProgress((progress.processedCount / progress.totalCount) * 100);
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

  const handleHardDeleteUsers = async (count: number) => {
    await hardDeleteUsers(count);
   }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 animate-fade-in-up animation-delay-200">
          <MembersHeader
            onSearch={handleSearch}
            onAddMember={handleAddMember}
            onBulkImport={() => setIsBulkImportOpen(true)}
            totalMembers={totalMembers}
            onRefresh={refreshData}
            isRefreshing={isRefreshing}
          />
        </div>
        {/* THIS IS A HARD DELETE OF USERS BUTTON, DON'T TOUCH IT */}
        {/* <Button variant="destructive" onClick={() => handleHardDeleteUsers(2)} className="mb-4">!Delete users!</Button> */}

        <div className="mb-6 animate-fade-in-up animation-delay-400">
          <MembersFilters
            programs={programs}
            onSearch={handleSearch}
            onProgramFilter={handleProgramFilter}
            onSortBy={handleSortBy}
            searchTerm={searchQuery}
            programFilter={programFilter}
            disabled={isLoading || isRefreshing}
            viewMode={viewMode as ViewMode}
            onViewChange={handleViewModeChange}
          />
        </div>

        <div className="space-y-6 animate-fade-in-up animation-delay-600">
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
        </div>

        {!isLoading && !isRefreshing && !isSearchActive && members.length > 0 && totalPages > 1 && (
          <div className="mt-8 animate-fade-in-up animation-delay-800">
            <MembersPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}

        <MemberForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={handleFormSubmit}
          member={selectedMember}
          facultyData={faculties}
          programData={programs}
          isSubmitting={isFormSubmitting}
        />

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
    </div>
  );
}
