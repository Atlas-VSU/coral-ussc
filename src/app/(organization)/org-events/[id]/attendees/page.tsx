"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftIcon,
  SearchIcon,
  UsersIcon,
  CalendarIcon,
  UserPlusIcon,
  DownloadIcon,
  Loader2,
  ArrowRightIcon,
  ClockIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataPagination } from "@/components/shared/DataPagination";
import { useEventAttendees } from "@/features/organization/attendees/hooks/useEventAttendees";
import { AttendanceSkeletonLoader } from "@/features/organization/events/components/AttendanceSkeletonLoader";
import { exportEventAttendance, downloadCsvFile } from "@/features/organization/attendees/csv.export.utils";
import { toast } from "sonner";
import { BulkFinesIssuance } from "@/features/organization/fines/components/BulkFinesIssuance";
import { AttendanceListSkeleton } from "@/features/organization/attendees/components/AttendanceListSkeleton";
import { EventDetails } from "@/features/organization/attendees/components/EventDetails";
import { AttendeesHeader } from "@/features/organization/attendees/components/AttendeesHeader";
import { AttendeesFilters } from "@/features/organization/attendees/components/AttendeesFilters";

function formatDate(dateStr: string | Date) {
  return new Date(dateStr).toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function EventAttendeesPage() {
  const params = useParams();
  const eventId = params.id as string;
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isExporting, setIsExporting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBulkIssueFinesOpen, setBulkIssueFinesOpen] = useState(false);

  const {
    eventData,
    attendees,
    totalAttendees,
    totalPages,
    currentPage,
    attendeesLoading,
    error,
    handleSearch,
    goToSpecificPage,
    hasNextPage,
    hasPrevPage,
    refreshData,
    handleSortChange,
    handleProgramFilter,
  } = useEventAttendees(eventId);

  const ITEMS_PER_PAGE = 10;

  // Handle CSV export
  const handleExportAttendance = async () => {
    try {
      setIsExporting(true);
      const result = await exportEventAttendance(eventId);
      
      if (result.success) {
        downloadCsvFile(result.csvContent!, result.eventName);
        toast.success(`Successfully exported ${result.totalRecords} attendance records`);
      } else {
        toast.error(result.error || 'Failed to export attendance data');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('An unexpected error occurred during export');
    } finally {
      setIsExporting(false);
    }
  };

  const handleGenerateFines = async () => {
    setIsGenerating(true);
    setBulkIssueFinesOpen(true);
  }


  // REMOVED: The local useState and useEffect for fetching the event
  // have been removed to avoid fetching the same data twice.

  const handleClose = () => {
    setBulkIssueFinesOpen(false);
    setIsGenerating(false);
    refreshData(); 
  }

  if (attendeesLoading && !eventData) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <h2 className="text-xl font-bold text-foreground">Event not found</h2>
        <p className="text-sm text-muted-foreground">
          {error ? "Failed to load event data." : "The event you are looking for does not exist."}
        </p>
        <Button asChild variant="outline">
          <Link href="/org-events">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Events
          </Link>
        </Button>
      </div>
    );
  }

  function getAttendanceStatus(timeIn: any, timeOut: any) {
    if (timeIn && timeOut) return "present";
    if (!timeIn && !timeOut) return "absent";
    return "partially absent";
  }

  // Safe to calculate stats now because eventData and attendees are guaranteed to exist
  const displayedAttendees = filterStatus === "all" 
    ? attendees 
    : attendees.filter((a) => a.status === filterStatus);

  const presentCount = attendees.filter((a) => a.status === "present").length;
  const absentCount = attendees.filter((a) => a.status === "absent").length;
  const partiallyAbsentCount = attendees.filter((a) => a.status === "partially absent").length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            asChild
            className="h-9 w-9 shrink-0 rounded-lg"
          >
            <Link href="/org-events">
              <ArrowLeftIcon className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground leading-tight">
              {eventData.name}
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
              <CalendarIcon className="h-3.5 w-3.5" />
              {formatDate(eventData.date)}
            </div>
          </div>
        </div>
        <Button asChild size="sm" className="gap-1.5 self-start sm:self-auto">
          <Link href={`/org-events/${eventId}/log-attendance`}>
            <UserPlusIcon className="h-4 w-4" />
            Log Attendance
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-card p-4">
          <div className="text-2xl font-bold text-foreground">
            {totalAttendees}
          </div>
          <div className="text-xs text-muted-foreground font-medium mt-0.5">
            Total Records
          </div>
        </Card>
        <Card className="bg-card p-4">
          <div className="text-2xl font-bold text-[#1B5E20]">
            {presentCount}
          </div>
          <div className="text-xs text-muted-foreground font-medium mt-0.5">
            Present
          </div>
        </Card>
        <Card className="bg-card p-4">
          <div className="text-2xl font-bold text-red-500">{absentCount}</div>
          <div className="text-xs text-muted-foreground font-medium mt-0.5">
            Absent
          </div>
        </Card>
        <Card className="bg-card p-4">
          <div className="text-2xl font-bold text-yellow-600">
            {partiallyAbsentCount} 
          </div>
          <div className="text-xs text-muted-foreground font-medium mt-0.5">
            Partially Absent 
          </div>
        </Card>
      </div>

      {/* Search + List */}
      <Card className="bg-card">
        <div className="flex flex-row justify-between">
          <CardHeader className="pb-3 w-[50%]">
            <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <UsersIcon className="h-4 w-4 text-primary" />
              Attendance Records
            </CardTitle>
          </CardHeader>
          
          <div className="flex items-center gap-2 my-3 mr-7">
            <Button 
              variant="outline" 
              onClick={handleExportAttendance}
              disabled={isExporting}
            >
              {isExporting ? "Exporting..." : "Export CSV"}
              {!isExporting && <DownloadIcon className="w-4 h-4 ml-2" />}
            </Button>

          </div>
        </div>
        
        <CardContent>
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by student name or ID…"
                className="pl-9 h-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  handleSearch(e.target.value);
                }}
              />
            </div>
            <Select
              value={filterStatus}
              onValueChange={(v) => setFilterStatus(v)}
            >
              <SelectTrigger className="w-36 h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="partially absent">Partially Absent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <EventDetails
            event={eventData as any}
            attendeeCount={totalAttendees}
          />

        {eventData && (
          <BulkFinesIssuance
          open={isBulkIssueFinesOpen}
          onOpenChange={handleClose}
          event={eventData}
          />
        )}

          <div className="mb-6">
            <AttendeesHeader
              event={eventData as any}
              onExport={handleExportAttendance}
              onGenerateFines={handleGenerateFines}
              isExporting={isExporting}
              isGenerating={isGenerating}
            />
          </div>

          {/* Filters Section */}
          <div className="mb-6">
            <AttendeesFilters
              onSearch={handleSearch}
              onSortChange={handleSortChange}
              onProgramFilter={handleProgramFilter}
            />
          </div>

          {/* Attendees List */}
          <div className="mb-6">
            {attendeesLoading ? (
              <AttendanceListSkeleton />
            ) : (
                  <div className="space-y-2">
                  {attendees.map((record: any) => {
                    const status = getAttendanceStatus(record.timeIn, record.timeOut);
                    return (
                      <div
                        key={record.id}
                        className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                          {record.student?.firstName?.charAt(0) || "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground leading-tight truncate">
                            {record.student?.firstName} {record.student?.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {record.student?.studentId}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Time In */}
                        <Badge variant="outline" className="flex items-center gap-1.5 h-7 px-2.5 bg-green-50 text-green-700 border-green-200">
                          <ArrowRightIcon className="h-3 w-3" />
                          <ClockIcon className="h-3 w-3" />
                          <span className="text-xs">
                            {record.timeIn
                              ? new Date(record.timeIn).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", hour12: true })
                              : "Not recorded"}
                          </span>
                        </Badge>

                        {/* Time Out */}
                        <Badge variant="outline" className="flex items-center gap-1.5 h-7 px-2.5 bg-amber-50 text-amber-700 border-amber-200">
                          <ArrowLeftIcon className="h-3 w-3" />
                          <ClockIcon className="h-3 w-3" />
                          <span className="text-xs">
                            {record.timeOut
                              ? new Date(record.timeOut).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", hour12: true })
                              : "Not recorded"}
                          </span>
                        </Badge>
                        {/* Status Badge */}
                        <Badge
                          className={`text-xs font-semibold ${
                            status === "present"
                              ? "bg-[#C8E6C9] text-[#1B5E20] border-[#A5D6A7]"
                              : status === "partially absent"
                                ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                                : "bg-red-100 text-red-800 border-red-300"
                          }`}
                        >
                          {status === "partially absent"
                            ? "Partially Absent"
                            : status.charAt(0).toUpperCase() + status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    );
                  })}
                </div>
            )}
          </div>
                  

          {/* Only show pagination if there are items */}
          {totalAttendees > 0 && (
            <div className="mt-4">
              <DataPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalAttendees}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={goToSpecificPage}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {eventData && (
        <BulkFinesIssuance
          open={isBulkIssueFinesOpen}
          onOpenChange={handleClose}
          event={eventData}
        />
      )}
    </div>
  );
}