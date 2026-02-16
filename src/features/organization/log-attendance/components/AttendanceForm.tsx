"use client";

import { useEffect, useState } from "react";
import { Event } from "@/features/organization/events/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  EyeIcon,
  EyeOffIcon,
  AlertCircleIcon,
  XCircleIcon,
  ClockIcon,
  TimerIcon,
  LogInIcon,
  LogOutIcon,
  CheckCircle2Icon,
  CircleAlertIcon,
} from "lucide-react";
import { isValidStudentId } from "../utils";
import { AddStudentDialog } from "./AddStudentDialog";

// Search related components and elements
import { AlternativeCheckInMethods } from "./Search/AlternativeCheckInMethods";
import { LoadingOverlay } from "./Search/LoadingOverlay";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { SearchByIdForm } from "./Search/SearchByIdForm";
import { SearchByNameForm } from "./Search/SearchByNameForm";
import { StudentDetails } from "./Search/StudentDetails";
import { NoStudentFound } from "./Search/NoStudentFound";
import { ProcessingOverlay } from "./Search/ProcessingOverlay";

import { toast } from "sonner";
import { Member } from "../../members/types";
import { useStudentSearch } from "../hooks/useStudentSearch";
import { useAuthState } from "@/hooks/useAuthState";
import { cn } from "@/lib/utils";
import { StudentDetailsOutsideOrg } from "./Search/StudentDetailsOutsideOrg";
import { getCurrentUserData, searchUserByStudentId } from "@/firebase";
import { WarningDialog } from "./WarningDialog";

interface AttendanceFormProps {
  event: Event;
  type: "time-in" | "time-out";
  onSubmit: (studentId: string) => Promise<void>;
  hasTimeIn?: boolean;
  hasTimeOut?: boolean;
  activeTab?: "time-in" | "time-out";
  onTabChange?: (tab: "time-in" | "time-out") => void;
}

export function AttendanceForm({
  event,
  type,
  onSubmit,
  hasTimeIn = true,
  hasTimeOut = false,
  activeTab,
  onTabChange,
}: AttendanceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [showNames, setShowNames] = useState(false);
  const [searchMethod, setSearchMethod] = useState<"id" | "name">("id");
  const { user: currentUser } = useAuthState();

  const {
    studentId,
    setStudentId,
    searchName,
    setSearchName,
    isSearching,
    setIsSearching,
    searchResult,
    setSearchResult,
    nameSearchResults,
    setNameSearchResults,
    hasPerformedNameSearch,
    setHasPerformedNameSearch,
    currentUserData,
    searchById,
    searchByName,
    checkAttendanceExists,
    resetSearch,
  } = useStudentSearch(event.id.toString(), type);

  // Handle ID search
  const handleIdSearch = async () => {
    if (!currentUser) {
      console.error("User not authenticated.");
      toast.error("You must be signed in to perform this action.");
      return;
    }

    if (!studentId.trim()) {
      toast.error("Please enter a student ID");
      return;
    }

    if (!isValidStudentId(studentId)) {
      setSearchResult({ status: "invalid-format", student: null });
      return;
    }

    setIsLoading(true);
    const result = await searchById(studentId, currentUser, true);
    setSearchResult(result);
    setIsLoading(false);
  };

  // Handle auto-complete search (disabled)
  const handleAutoSearch = async () => {
    // This is kept as a placeholder for compatibility
    // Auto-search has been disabled to prevent unwanted loading states
    return;
  };

  // Handle name search
  const handleNameSearch = async () => {
    if (!searchName.trim()) {
      setNameSearchResults([]);
      setHasPerformedNameSearch(false);
      return;
    }

    setIsSearching(true);
    setHasPerformedNameSearch(true);

    const results = await searchByName(searchName, currentUser, true);
    setNameSearchResults(results);
    setIsSearching(false);
  };

  const handleNameSelect = async (student: Member) => {
    setStudentId(student.studentId);
    setSearchResult({ status: "success", student });
    setNameSearchResults([]);
    setSearchName("");
    setHasPerformedNameSearch(false);

    setIsSubmitting(true);
    setIsLoading(true);
    setIsProcessing(true);

    try {
      if (await checkAttendanceExists(student.studentId)) {
        toast.error("Attendance record already exists.");
        setIsProcessing(false);
        setIsLoading(false);
        setIsSubmitting(false);
        return;
      }

      // Simulate network delay but reduce from 2000ms to 1000ms
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await onSubmit(student.studentId);

      // Show success toast
      const studentName = showNames
        ? student.firstName + " " + student.lastName
        : "Student";

      const getMessage = () => {
        if (event.status === "completed") {
          return `${studentName} - Special attendance logged for ${event.name}.`;
        }
        return `${studentName} has successfully ${
          type === "time-in" ? "checked in" : "checked out"
        } for ${event.name}.`;
      };

      toast.success(getMessage());

      // Reset form after successful submission (reduced timeout)
      setTimeout(() => {
        resetSearch();
        setIsProcessing(false);
      }, 1000);
    } catch (error) {
      console.error("Error logging attendance:", error);
      toast.error("Failed to record attendance");
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  };

  const handleNameSearchChange = (value: string) => {
    setSearchName(value);
    if (!value.trim()) {
      setNameSearchResults([]);
      setHasPerformedNameSearch(false);
    } else {
      setHasPerformedNameSearch(false);
    }
  };

  const handleCancelSearch = () => {
    resetSearch();
  };

  const [warningDialog, setWarningDialog] = useState<{
  open: boolean;
  title: string;
  description: string;
  type: "program" | "faculty";
  studentName?: string;
  onConfirm: () => void | Promise<void>;
  }>({
    open: false,
    title: "",
    description: "",
    type: "program",
    onConfirm: () => {}
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (searchResult.status !== "success" && 
        searchResult.status !== "success-different-organization" && 
        searchResult.status !== "success-different-faculty" || 
        !searchResult.student) {
      return;
    }

    // set submitting state immediately to disable button
    setIsSubmitting(true);
    setIsLoading(true);

    try {
      if (await checkAttendanceExists(studentId)) {
        toast.error("Attendance record already exists.");
        setIsProcessing(false);
        setIsLoading(false);
        setIsSubmitting(false);
        return;
      }

      const student = await searchUserByStudentId(studentId);
      const studentName = showNames
        ? `${student?.firstName} ${student?.lastName}`
        : "This student";

      // Determine if warning is needed
      if (currentUserData?.accessLevel === 1 && currentUserData.programId !== student?.programId) {
        setWarningDialog({
          open: true,
          title: "Program Mismatch Detected",
          description: `${studentName} is not enrolled in your program. This may indicate they're attending an event outside their designated program.`,
          type: "program",
          studentName: showNames ? `${student?.firstName} ${student?.lastName}` : undefined,
          onConfirm: async () => {
            setWarningDialog(prev => ({ ...prev, open: false }));
            await proceedWithSubmission(studentId);
          }
        });
        return;
      } 
      else if (currentUserData?.accessLevel === 2 && currentUserData.facultyId !== student?.facultyId) {
        setWarningDialog({
          open: true,
          title: "Faculty Mismatch Detected",
          description: `${studentName} is not registered under your faculty. They may be attending an event organized by a different faculty.`,
          type: "faculty",
          studentName: showNames ? `${student?.firstName} ${student?.lastName}` : undefined,
          onConfirm: async () => {
            setWarningDialog(prev => ({ ...prev, open: false }));
            await proceedWithSubmission(studentId);
          }
        });
        return;
      } else {
        await proceedWithSubmission(studentId);
      }

    } catch (error) {
      console.error("Error logging attendance:", error);
      toast.error("Failed to record attendance");
      setIsProcessing(false);
      setIsLoading(false);
      setIsSubmitting(false);
    }
  };

  const proceedWithSubmission = async (studentId: string) => {
    setIsProcessing(true);
    
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await onSubmit(studentId);

      const studentName = showNames
        ? searchResult.student!.firstName + " " + searchResult.student!.lastName
        : "Student";

      const getMessage = () => {
        if (event.status === "completed") {
          return `${studentName} - Special attendance logged for ${event.name}.`;
        }
        return `${studentName} has successfully ${
          type === "time-in" ? "checked in" : "checked out"
        } for ${event.name}.`;
      };

      toast.success(getMessage());

      setTimeout(() => {
        resetSearch();
        setIsProcessing(false);
      }, 1000);
    } catch (error) {
      console.error("Error in submission:", error);
      toast.error("Failed to record attendance");
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  };


  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (searchMethod === "id" && searchResult.status !== "success" && searchResult.status !== "success-different-organization" && searchResult.status !== "success-different-faculty") {
        handleIdSearch();
      } else if (searchMethod === "name") {
        handleNameSearch();
      } else if (searchResult.status === "success" || searchResult.status === "success-different-organization" || searchResult.status === "success-different-faculty") {
        handleSubmit(e as unknown as React.FormEvent);
      }
    }
  };

  // Determine color scheme based on attendance type
  const colorScheme =
    type === "time-in"
      ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
      : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800";

  // Get mode-specific icon
  const ModeIcon = type === "time-in" ? LogInIcon : LogOutIcon;
  const modeIconColor =
    type === "time-in"
      ? "text-green-600 dark:text-green-400"
      : "text-amber-600 dark:text-amber-400";

  return (
    <>
      {/* Search loading overlay - only for form submission, not for searching */}
      {isLoading && <LoadingOverlay />}

      {/* Processing check-in/out overlay */}
      {isProcessing && (
        <ProcessingOverlay
          type={type}
          showNames={showNames}
          studentName={
            searchResult.student?.firstName +
              " " +
              searchResult.student?.lastName || ""
          }
        />
      )}

      <WarningDialog
        open={warningDialog.open}
        onOpenChange={(open) => {
          setWarningDialog(prev => ({ ...prev, open }));
          // reset states when dialog is closed without confirming
          if (!open) {
            setIsProcessing(false);
            setIsLoading(false);
            setIsSubmitting(false);
          }
        }}
        onConfirm={warningDialog.onConfirm}
        onCancel={() => {
          setWarningDialog(prev => ({ ...prev, open: false }));
          setIsProcessing(false);
          setIsLoading(false);
          setIsSubmitting(false);
        }}
        title={warningDialog.title}
        description={warningDialog.description}
        warningType={warningDialog.type}
        studentName={warningDialog.studentName}
    />

      <div
        className={cn(
          "space-y-6 rounded-lg border transition-colors",
          colorScheme
        )}
      >
        {/* Status Banner - Always visible to prevent mode confusion */}
        <div
          className={cn(
            "px-4 py-3 rounded-t-lg flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between",
            type === "time-in"
              ? "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200"
              : "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200"
          )}
        >
          <div className="flex items-center">
            <ModeIcon className="h-5 w-5 mr-2" />
            <span className="font-nunito font-bold text-lg tracking-wide">
              {type === "time-in" ? "CHECK-IN MODE" : "CHECK-OUT MODE"}
            </span>
          </div>

          {hasTimeIn && hasTimeOut && onTabChange && (
            <div className="w-full sm:w-auto">
              <Button
                variant="secondary"
                size="lg"
                onClick={() =>
                  onTabChange(type === "time-in" ? "time-out" : "time-in")
                }
                className={cn(
                  "w-full sm:w-auto mt-2 sm:mt-0 font-nunito-sans font-bold rounded-md shadow focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all",
                  type === "time-in"
                    ? "bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-600"
                    : "bg-green-600 hover:bg-green-700 text-white focus:ring-green-600"
                )}
                aria-label={`Switch to ${
                  type === "time-in" ? "Check-Out" : "Check-In"
                } mode`}
              >
                {type === "time-in" ? (
                  <>
                    <TimerIcon className="h-5 w-5 mr-2" />
                    Switch to Check-Out
                  </>
                ) : (
                  <>
                    <ClockIcon className="h-5 w-5 mr-2" />
                    Switch to Check-In
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        <div className="px-4 sm:px-6 pt-2 pb-4 sm:pb-6 space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <h3 className="flex items-center gap-3 text-xl font-nunito font-bold text-gray-900 dark:text-gray-100">
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    type === "time-in"
                      ? "bg-green-100 dark:bg-green-900/30"
                      : "bg-amber-100 dark:bg-amber-900/30"
                  )}
                >
                  <ModeIcon className={cn("h-5 w-5", modeIconColor)} />
                </div>
                {type === "time-in" ? "Check-In" : "Check-Out"} Station
              </h3>
              <p className="font-nunito-sans text-base text-gray-600 dark:text-gray-400 mt-2">
                {type === "time-in"
                  ? "Record student attendance for this event"
                  : "Record student departure from this event"}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowNames(!showNames)}
              className="h-9 px-4 font-nunito-sans font-medium border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 w-full sm:w-auto"
            >
              {showNames ? (
                <>
                  <EyeOffIcon className="h-4 w-4 mr-2" />
                  Hide Names
                </>
              ) : (
                <>
                  <EyeIcon className="h-4 w-4 mr-2" />
                  Show Names
                </>
              )}
            </Button>
          </div>

          {/* Type Selection - Only show if both are available */}
          {/* {hasTimeIn && hasTimeOut && onTabChange && (
            <div className="mt-6 flex flex-wrap gap-2">
              <Button
                variant={activeTab === "time-in" ? "default" : "outline"}
                size="sm"
                onClick={() => onTabChange("time-in")}
                className={cn(
                  "font-nunito-sans font-semibold",
                  activeTab === "time-in" && "bg-green-600 hover:bg-green-700"
                )}
              >
                <ClockIcon className="h-4 w-4 mr-2" />
                Check-In
              </Button>
              <Button
                variant={activeTab === "time-out" ? "default" : "outline"}
                size="sm"
                onClick={() => onTabChange("time-out")}
                className={cn(
                  "font-nunito-sans font-semibold",
                  activeTab === "time-out" && "bg-amber-600 hover:bg-amber-700"
                )}
              >
                <TimerIcon className="h-4 w-4 mr-2" />
                Check-Out
              </Button>
            </div>
          )} */}

          {/* Current mode notice - reinforcement */}
          <div
            className={cn(
              "rounded-md p-3 flex items-center",
              type === "time-in"
                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                : "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200"
            )}
          >
            {type === "time-in" ? (
              <CheckCircle2Icon className="h-5 w-5 mr-2 flex-shrink-0" />
            ) : (
              <CircleAlertIcon className="h-5 w-5 mr-2 flex-shrink-0" />
            )}
            <p className="text-sm font-medium">
              {type === "time-in"
                ? "You are recording student arrivals (check-ins) for this event."
                : "You are recording student departures (check-outs) for this event."}
            </p>
          </div>

          {/* Search form */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <Tabs
              defaultValue="id"
              onValueChange={(value) => setSearchMethod(value as "id" | "name")}
            >
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100 dark:bg-gray-700">
                <TabsTrigger
                  value="id"
                  className="flex items-center gap-1.5 font-nunito-sans font-semibold"
                >
                  By Student ID
                </TabsTrigger>
                <TabsTrigger
                  value="name"
                  disabled={true}
                  className="flex items-center gap-1.5 font-nunito-sans font-semibold"
                >
                  By Name
                  <span className="text-xs ml-1 text-muted-foreground">(Soon)</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="id">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-4">
                    <SearchByIdForm
                      studentId={studentId}
                      setStudentId={setStudentId}
                      handleSearch={handleIdSearch}
                      handleAutoSearch={handleAutoSearch}
                      isSubmitting={isSubmitting}
                      searchStatus={searchResult.status}
                      successMessage={null}
                      showLabel={true}
                      handleKeyDown={handleKeyDown}
                    />
                  </div>

                  {searchResult.status == "success-different-organization" && searchResult.student && (
                 
                        <StudentDetailsOutsideOrg
                          student={searchResult.student}
                          showNames={showNames}
                          isSubmitting={isSubmitting}
                          type={type}
                          level="Organization"
                          buttonVariant="warning"
                          onCancel={handleCancelSearch}
                        />
                  )}

                  {searchResult.status == "success-different-faculty" && searchResult.student && (
                     
                        <StudentDetailsOutsideOrg
                          student={searchResult.student}
                          showNames={showNames}
                          isSubmitting={isSubmitting}
                          type={type}
                          level="Faculty"
                          buttonVariant="warning"
                          onCancel={handleCancelSearch}
                        />
                     
                  )}

                  {searchResult.status === "success" &&
                    searchResult.student && (
                      
                        <StudentDetails
                          student={searchResult.student}
                          showNames={showNames}
                          isSubmitting={isSubmitting}
                          type={type}
                          buttonVariant="success"
                          onCancel={handleCancelSearch}
                        />
                    )}

                  {/* Use NoStudentFound component */}
                  {searchResult.status === "not-found" && (
                    <NoStudentFound
                      searchTerm={studentId}
                      searchType="id"
                      onAddStudent={() => setIsAddStudentOpen(true)}
                    />
                  )}

                  {/* Show error state */}
                  {searchResult.status === "error" && (
                    <Alert variant="destructive">
                      <AlertCircleIcon className="h-4 w-4" />
                      <AlertDescription>
                        An error occurred while searching for the student.
                        Please try again.
                      </AlertDescription>
                    </Alert>
                  )}
                </form>
              </TabsContent>

              <TabsContent value="name">
                <div className="space-y-4">
                  <SearchByNameForm
                    searchName={searchName}
                    setSearchName={handleNameSearchChange}
                    handleSearch={handleNameSearch}
                    handleKeyDown={handleKeyDown}
                    isSubmitting={isSubmitting}
                    isSearching={isSearching}
                    nameSearchResults={nameSearchResults}
                    showNames={showNames}
                    onStudentSelect={handleNameSelect}
                    showLabel={true}
                    enhancedResults={true}
                  />
                </div>

                {/* Use NoStudentFound component when no results and search has been performed */}
                {nameSearchResults.length === 0 &&
                  searchName.trim() !== "" &&
                  hasPerformedNameSearch && (
                    <div className="mt-4">
                      <NoStudentFound
                        searchTerm={searchName}
                        searchType="name"
                        onAddStudent={() => setIsAddStudentOpen(true)}
                      />
                    </div>
                  )}

                {/* Show cancel button when results are shown */}
                {nameSearchResults.length > 0 && (
                  <div className="mt-4 flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCancelSearch}
                      className="h-9"
                    >
                      <XCircleIcon className="h-4 w-4 mr-2" />
                      Clear Results
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Alternative check-in methods */}
          <AlternativeCheckInMethods />

          <AddStudentDialog
            open={isAddStudentOpen}
            onOpenChange={setIsAddStudentOpen}
            suggestedId={studentId}
            onStudentAdded={(student) => {
              setSearchResult({ status: "success", student });
              setIsAddStudentOpen(false);
              toast.success("Student added successfully");
            }}
          />
        </div>
      </div>
    </>
  );
}
