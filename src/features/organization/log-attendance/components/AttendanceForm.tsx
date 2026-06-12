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

import { AlternativeCheckInMethods } from "./Search/AlternativeCheckInMethods";
import { LoadingOverlay } from "./Search/LoadingOverlay";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { SearchByIdForm } from "./Search/SearchByIdForm";
import { SearchByNameForm } from "./Search/SearchByNameForm";
import { StudentDetails } from "./Search/StudentDetails";
import { NoStudentFound } from "./Search/NoStudentFound";
// import { ProcessingOverlay } from "./Search/ProcessingOverlay";

import { toast } from "sonner";
import { Member } from "../../members/types";
import { useStudentSearch } from "../hooks/useStudentSearch";
import { useAuthState } from "@/hooks/useAuthState";
import { cn } from "@/lib/utils";
import { StudentDetailsOutsideOrg } from "./Search/StudentDetailsOutsideOrg";
import { searchUserByStudentId } from "@/firebase";
import { WarningDialog } from "./WarningDialog";
import { getOrgById } from "@/firebase/organization";

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

  const handleIdSearch = async () => {
    if (!currentUser) {
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

  const handleAutoSearch = async () => {
    return;
  };

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
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await onSubmit(student.studentId);

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
    onConfirm: () => {},
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      (searchResult.status !== "success" &&
        searchResult.status !== "success-different-organization" &&
        searchResult.status !== "success-different-faculty") ||
      !searchResult.student
    ) {
      return;
    }

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
      const org = await getOrgById(currentUserData!.orgId!);
      const studentName = showNames
        ? `${student?.firstName} ${student?.lastName}`
        : "This student";
      // Determine if warning is needed
      if (currentUserData?.accessLevel === 1 && org!.programId !== student?.programId) {
        setWarningDialog({
          open: true,
          title: "Program Mismatch Detected",
          description: `${studentName} is not enrolled in your program. This may indicate they're attending an event outside their designated program.`,
          type: "program",
          studentName: showNames ? `${student?.firstName} ${student?.lastName}` : undefined,
          onConfirm: async () => {
            setWarningDialog((prev) => ({ ...prev, open: false }));
            await proceedWithSubmission(studentId);
          },
        });
        return;
      } else if (currentUserData?.accessLevel === 2 && org!.facultyId !== student?.facultyId) {
        setWarningDialog({
          open: true,
          title: "Faculty Mismatch Detected",
          description: `${studentName} is not registered under your faculty. They may be attending an event organized by a different faculty.`,
          type: "faculty",
          studentName: showNames ? `${student?.firstName} ${student?.lastName}` : undefined,
          onConfirm: async () => {
            setWarningDialog((prev) => ({ ...prev, open: false }));
            await proceedWithSubmission(studentId);
          },
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
      if (
        searchMethod === "id" &&
        searchResult.status !== "success" &&
        searchResult.status !== "success-different-organization" &&
        searchResult.status !== "success-different-faculty"
      ) {
        handleIdSearch();
      } else if (searchMethod === "name") {
        handleNameSearch();
      } else if (
        searchResult.status === "success" ||
        searchResult.status === "success-different-organization" ||
        searchResult.status === "success-different-faculty"
      ) {
        handleSubmit(e as unknown as React.FormEvent);
      }
    }
  };

  const isTimeIn = type === "time-in";
  const ModeIcon = isTimeIn ? LogInIcon : LogOutIcon;

  // Banner: time-in uses green system, time-out stays amber (intentional semantic contrast)
  const bannerStyle = isTimeIn
    ? { background: "#C0DD97", color: "#27500A" }
    : undefined;
  const bannerClass = isTimeIn
    ? ""
    : "bg-amber-100 text-amber-800";

  const outerBorderStyle = isTimeIn
    ? { borderColor: "#97C459" }
    : undefined;
  const outerBorderClass = isTimeIn ? "" : "border-amber-200";

  const modeNoticeStyle = isTimeIn
    ? { background: "#EAF3DE", color: "#3B6D11", borderColor: "#C0DD97" }
    : undefined;
  const modeNoticeClass = isTimeIn ? "" : "bg-amber-50 text-amber-700 border-amber-200";

  const iconContainerStyle = isTimeIn
    ? { background: "#EAF3DE" }
    : undefined;
  const iconContainerClass = isTimeIn ? "" : "bg-amber-100";

  const iconStyle = isTimeIn ? { color: "#058C11" } : undefined;
  const iconClass = isTimeIn ? "" : "text-amber-700";

  const switchBtnClass = isTimeIn
    ? "bg-amber-600 hover:bg-amber-700 text-white"
    : "";
  const switchBtnStyle = !isTimeIn
    ? { background: "#058C11", color: "#ffffff" }
    : undefined;

  return (
    <>
      {/* Search loading overlay - only for form submission, not for searching */}
      {isLoading && <LoadingOverlay />}
      {/* Processing check-in/out overlay */}
      {/* {isProcessing && (
        <ProcessingOverlay
          type={type}
          showNames={showNames}
          studentName={
            searchResult.student?.firstName +
              " " +
              searchResult.student?.lastName || ""
          }
        />
      )} */}

      <WarningDialog
        open={warningDialog.open}
        onOpenChange={(open) => {
          // reset states when dialog is closed without confirming
          setWarningDialog((prev) => ({ ...prev, open }));
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
        className={cn("space-y-0 rounded-xl border transition-colors overflow-hidden", outerBorderClass)}
        style={outerBorderStyle}
      >
        {/* Status Banner - Always visible to prevent mode confusion */}
        <div
          className={cn("px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between", bannerClass)}
          style={bannerStyle}
        >
          <div className="flex items-center gap-2">
            <ModeIcon className="h-5 w-5" />
            <span className="font-nunito font-bold text-base tracking-wide">
              {isTimeIn ? "CHECK-IN MODE" : "CHECK-OUT MODE"}
            </span>
          </div>

          {hasTimeIn && hasTimeOut && onTabChange && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onTabChange(isTimeIn ? "time-out" : "time-in")}
              className={cn("w-full sm:w-auto mt-1 sm:mt-0 font-bold rounded-lg text-xs shadow transition-all", switchBtnClass)}
              style={switchBtnStyle}
            >
              {isTimeIn ? (
                <><TimerIcon className="h-4 w-4 mr-1.5" />Switch to Check-Out</>
              ) : (
                <><ClockIcon className="h-4 w-4 mr-1.5" />Switch to Check-In</>
              )}
            </Button>
          )}
        </div>

        <div className="px-4 sm:px-6 pt-5 pb-5 sm:pb-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", iconContainerClass)}
                style={iconContainerStyle}
              >
                <ModeIcon
                  className={cn("h-5 w-5", iconClass)}
                  style={iconStyle}
                />
              </div>
              <div>
                <h3
                  className="font-nunito text-base font-bold"
                  style={{ color: "#27500A" }}
                >
                  {isTimeIn ? "Check-In" : "Check-Out"} Station
                </h3>
                <p className="font-nunito-sans text-xs mt-0.5" style={{ color: "#3B6D11" }}>
                  {isTimeIn
                    ? "Record student attendance for this event"
                    : "Record student departure from this event"}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowNames(!showNames)}
              className="h-9 px-3 font-medium text-xs w-full sm:w-auto shadow-sm transition-all duration-200 hover:scale-[1.02]"
              style={{
                borderColor: "#97C459",
                color: "#27500A",
                background: "#ffffff",
              }}
            >
              {showNames ? (
                <><EyeOffIcon className="h-3.5 w-3.5 mr-1.5" />Hide Names</>
              ) : (
                <><EyeIcon className="h-3.5 w-3.5 mr-1.5" />Show Names</>
              )}
            </Button>
          </div>


          {/* Mode notice */}
          <div
            className={cn("rounded-lg px-4 py-3 flex items-center gap-2 text-sm font-medium border", modeNoticeClass)}
            style={modeNoticeStyle}
          >
            {isTimeIn ? (
              <CheckCircle2Icon className="h-4 w-4 shrink-0" />
            ) : (
              <CircleAlertIcon className="h-4 w-4 shrink-0" />
            )}
            <p className="font-nunito-sans">
              {isTimeIn
                ? "You are recording student arrivals (check-ins) for this event."
                : "You are recording student departures (check-outs) for this event."}
            </p>
          </div>

          {/* Search form */}
          <div
            className="rounded-xl border p-5"
            style={{ background: "#ffffff", borderColor: "#C0DD97" }}
          >
            <Tabs
              defaultValue="id"
              onValueChange={(value) => setSearchMethod(value as "id" | "name")}
            >
              <TabsList className="grid w-full grid-cols-2 mb-5">
                <TabsTrigger value="id" className="font-nunito-sans font-semibold text-xs">
                  By Student ID
                </TabsTrigger>
                <TabsTrigger value="name" disabled className="font-nunito-sans font-semibold text-xs">
                  By Name
                  <span className="text-[10px] ml-1 text-muted-foreground">(Soon)</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="id">
                <form onSubmit={handleSubmit} className="space-y-4">
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

                  {searchResult.status === "success-different-organization" && searchResult.student && (
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

                  {searchResult.status === "success-different-faculty" && searchResult.student && (
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

                  {searchResult.status === "success" && searchResult.student && (
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
                        An error occurred while searching for the student. Please try again.
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
                      style={{ borderColor: "#97C459", color: "#27500A" }}
                    >
                      <XCircleIcon className="h-4 w-4 mr-2" style={{ color: "#058C11" }} />
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
