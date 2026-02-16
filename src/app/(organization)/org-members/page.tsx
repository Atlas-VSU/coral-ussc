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
  addUser,
  checkStudentIdExist,
  deleteUser,
  processFileForBulkImport,
  updateUser,
} from "@/firebase";
import { toast } from "sonner";
import { BulkImportResultModal } from "@/features/organization/members/components/BulkImportResultModal";
import { MembersSearchResults } from "@/features/organization/members/components/MembersSearchResults";
import { usePaginatedMembers } from "@/features/organization/members/hooks/usePaginatedMembers";
// import { CheckCircleIcon } from "lucide-react";
// import { debugCache } from "@/features/organization/members/services/membersCache";

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
    isSearching,
    searchResults,
    // dataSource,
    // cacheStatus,
    performSearch,
    handleSearch,
    handleProgramFilter,
    handleSortBy,
    handlePageChange,
    handleViewModeChange,
    refreshData,
    clearSearch,
    // clearCache,
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
        refreshData(); // Refresh data after deletion
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
        await addUser(data);
        toast.success("Member added successfully");
      }
      refreshData(); // Refresh data after update
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
      const result = (await processFileForBulkImport(file)) as BulkImportResult;
      setBulkImportResult(result);
      setIsBulkImportOpen(false);
      setIsBulkImportOpenResult(true);
      refreshData(); // Refresh data after bulk import
    } catch (error) {
      console.error("Bulk import failed:", error);
      toast.error("Failed to process the file. Please try again.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
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

        {/* Cache indicator */}
        {/* {!isLoading &&
          !isRefreshing &&
          dataSource === "cache" &&
          cacheStatus.isFromCache && (
            <div className="mb-4 flex items-center justify-between">
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                <CheckCircleIcon className="h-3 w-3 mr-1" />
                Using cached data ({cacheStatus.ageText})
              </span>
              <button
                onClick={refreshData}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Refresh
              </button>
            </div>
          )} */}

        {/* Filters Section */}
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

        {/* Main Content */}
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

        {/* Pagination */}
        {!isLoading && !isRefreshing && !isSearchActive && members.length > 0 && totalPages > 1 && (
          <div className="mt-8 animate-fade-in-up animation-delay-800">
            <MembersPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}

        {/* Debug tools (only in development)
        {process.env.NODE_ENV === "development" && (
          <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <h3 className="text-sm font-medium mb-2">Debug Tools</h3>
            <div className="flex flex-wrap gap-2 mb-2">
              <button
                onClick={clearCache}
                className="text-xs px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded"
              >
                Clear Cache
              </button>
              <button
                onClick={() => {
                  const stats = debugCache.getCacheSize();
                  toast.info(`Cache size: ${stats} KB`);
                  console.log({
                    cacheSize: stats,
                    entries: debugCache.getEntryCount(),
                    keys: debugCache.getAllKeys(),
                  });
                }}
                className="text-xs px-2 py-1 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded"
              >
                Show Cache Stats
              </button>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {dataSource === "cache"
                ? "Using cached data"
                : "Using server data"}
              {cacheStatus.isFromCache && ` (${cacheStatus.ageText})`}
            </div>
          </div>
        )} */}

        {/* Modals and Dialogs */}
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
