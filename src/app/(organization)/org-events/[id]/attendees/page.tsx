"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  SearchIcon,
  UsersIcon,
  CalendarIcon,
  UserPlusIcon,
  Loader2,
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
import { GenerateFinesDialog } from "@/features/organization/events/components/GenerateFinesDialog";
import { toast } from "sonner";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AttendeesPage({ params }: PageProps) {
  const { id } = use(params);
  const {
      eventData,
      attendees,
      totalAttendees,
      totalPages,
      currentPage,
      loading: eventLoading, // from useEventDetails
      attendeesLoading,
      error,
      handleSearch,
      goToSpecificPage,
    } = useEventAttendees( id );

  const [finesDialogOpen, setFinesDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [localPage, setLocalPage] = useState(1);

  const ITEMS_PER_PAGE = 10;

  if (eventLoading) {
    return (
      <div className="flex justify-center items-center py-20">
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

  const presentCount = attendees.filter((a) => a.status === "present").length;
  const absentCount = attendees.filter((a) => a.status === "absent").length;
  // const excusedCount = attendees.filter((a) => a.status === "excused").length; // will uncomment once excused status is implemented
  const partiallyAbsentCount = attendees.filter((a) => a.status === "partially absent").length;

  function handleGenerateFines() {
    toast.success(`${absentCount} fine(s) generated for absent students.`);
    setFinesDialogOpen(false);
  }

  const displayedAttendees = filterStatus === "all" 
    ? attendees 
    : attendees.filter((a) => a.status === filterStatus);

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
          <Link href={`/admin-events/${id}/log-attendance`}>
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
          <Button
            className="my-3 mr-7"
            onClick={() => setFinesDialogOpen(true)}
          >
            Generate Fines
          </Button>
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
                  handleSearch(e.target.value);
                }}
              />
            </div>
            <Select
              value={filterStatus}
              onValueChange={(v) => {
                setFilterStatus(v);
                // handleStatusFilter(v); // will uncomment once implemented in the hook
              }}
            >
              <SelectTrigger className="w-36 h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                {/* <SelectItem value="excused">Excused</SelectItem> */}
                <SelectItem value="partially absent">Partially Absent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {attendeesLoading ? (
            <div className="flex justify-center items-center py-10">
               <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : displayedAttendees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                <UsersIcon className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">
                No attendance records found
              </p>
              <p className="text-xs text-muted-foreground">
                {filterStatus !== "all"
                  ? "Try adjusting your filter."
                  : "No attendance has been logged for this event yet."}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {displayedAttendees.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                          {record.student?.firstName?.charAt(0) || "?"} 
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground leading-tight truncate">
                            {record.student?.firstName} {record.student?.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {record.student?.id} 
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {record.timeIn && (
                        <span className="text-xs text-muted-foreground hidden sm:block">
                          {record.timeIn}
                        </span>
                      )}
                      <Badge
                        className={`text-xs font-semibold ${
                          record.status === "present"
                            ? "bg-[#C8E6C9] text-[#1B5E20] border-[#A5D6A7]"
                            : record.status === "partially absent"
                              ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                              : "bg-red-100 text-red-800 border-red-300"
                        }`}
                      >
                        {record.status === "partially absent" ? "Partially Absent" : record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              <DataPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalAttendees}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={goToSpecificPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      <GenerateFinesDialog
        open={finesDialogOpen}
        onOpenChange={setFinesDialogOpen}
        eventName={eventData.name}
        attendance={attendees}
        onConfirm={handleGenerateFines}
      />
    </div>
  );
}
