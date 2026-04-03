"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/organization/general/PageHeader";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useEventsData } from "@/features/organization/events/hooks/useEventsData";
import { EventsList } from "@/features/organization/events/components/EventsList";
import { EventsTabNavigation } from "@/features/organization/events/components/EventsTabNavigation";
import { EventsFilters } from "@/features/organization/events/components/EventsFilters";
import { EventsPagination } from "@/features/organization/events/components/EventsPagination";
import { EventsSkeletonLoader } from "@/features/organization/events/components/EventsSkeletonLoader";
import { EventsCacheLoader } from "@/features/organization/events/services/eventsCacheLoader";
import { AddEventDialog } from "@/features/organization/events/components/AddEventDialog";
import { EventStatus } from "@/features/organization/events/types";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useEventFineTypes } from "@/features/organization/events/hooks/useEventFineTypes";
import type { ViewMode } from "@/features/organization/events/components/ViewToggle";

export default function EventsPage() {
  const [currentTab, setCurrentTab] = useState<EventStatus>("completed");
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [addOpen, setAddOpen] = useState(false);
  const isMobile = useIsMobile();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { fineTypes, fetchFineTypes } = useEventFineTypes();

  useEffect(() => {
    if (isMobile) {
      setViewMode("list");
    } else {
      const savedViewMode = localStorage.getItem("eventsViewMode") as ViewMode;
      if (
        savedViewMode &&
        (savedViewMode === "card" || savedViewMode === "list")
      ) {
        setViewMode(savedViewMode);
      }
    }
  }, [isMobile]);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (!isMobile) {
      localStorage.setItem("eventsViewMode", mode);
    }
  };

  const {
    events,
    totalEvents,
    loading,
    currentPage,
    totalPages,
    handlePageChange,
    handleSearch,
    handleSort,
    handleDateChange,
    searchQuery,
    refresh,
  } = useEventsData(currentTab);

  const handleAddEventClick = async () => {
    setAddOpen(true);
    if (fineTypes.length === 0) await fetchFineTypes();
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6 pb-5 xl:pb-0">
      <EventsCacheLoader />
 
      <PageHeader
        variant="admin"
        title="Events Management"
        context="2nd Semester · A.Y. 2025–2026"
        description="Manage your organization's events and track attendance"
        action={
          <div className="hidden xl:flex">
            <Button size="sm" className="gap-1.5" onClick={handleAddEventClick}>
              <Plus className="size-4" /> Add Event
            </Button>
          </div>
        }
      />

      {/* Mobile Add Event Button */}
      <Button
        size="sm"
        className="xl:hidden w-full h-11"
        onClick={handleAddEventClick}
      >
        <Plus className="size-4" /> Add Event
      </Button>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={searchInputRef}
          type="text"
          placeholder="Search events…"
          className="pl-9 pr-9 h-11 sm:h-10 bg-background text-base sm:text-sm"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9"
            onClick={() => handleSearch("")}
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Tab navigation + content */}
      <Tabs
        value={currentTab}
        onValueChange={(v) => setCurrentTab(v as EventStatus)}
        className="space-y-4 sm:space-y-6"
      >
        <EventsTabNavigation
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          loading={loading}
          isDesktop={!isMobile}
        />

        <EventsFilters
          onSetDate={handleDateChange}
          onSortBy={handleSort}
          viewMode={viewMode}
          onViewChange={handleViewModeChange}
          isDesktop={!isMobile}
        />

        <TabsContent value={currentTab} className="mt-0">
          {loading ? (
            <EventsSkeletonLoader viewMode={viewMode} />
          ) : (
            <EventsList
              events={events}
              onEventsUpdate={refresh}
              viewMode={viewMode}
            />
          )}
        </TabsContent>
      </Tabs>

      {!loading && totalPages > 0 && !searchQuery && (
        <EventsPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      <AddEventDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        fineTypes={fineTypes}
        onEventAdded={() => {
          refresh();
          setAddOpen(false);
        }}
      />
    </div>
  );
}
