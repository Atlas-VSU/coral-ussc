"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/PageHeader";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useEventsData } from "@/features/organization/events/hooks/useEventsData";
import { EventsList } from "@/features/organization/events/components/EventsList";
import { EventsTabNavigation } from "@/features/organization/events/components/EventsTabNavigation";
import { EventsFilters } from "@/features/organization/events/components/EventsFilters";
import { EventsPagination } from "@/features/organization/events/components/EventsPagination";
import { EventsSearchBar } from "@/features/organization/events/components/EventsSearchBar";
import { EventsSkeletonLoader } from "@/features/organization/events/components/EventsSkeletonLoader";
import { EventsCacheLoader } from "@/features/organization/events/services/eventsCacheLoader";
import { AddEventDialog } from "@/features/organization/events/components/AddEventDialog";
import { EventStatus } from "@/features/organization/events/types";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useEventFineTypes } from "@/features/organization/events/hooks/useEventFineTypes";
import type { ViewMode } from "@/features/organization/events/components/ViewToggle";

export default function EventsPage() {
  const [currentTab, setCurrentTab] = useState<EventStatus>("ongoing");
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
      if (savedViewMode && (savedViewMode === "card" || savedViewMode === "list")) {
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

  const clearSearch = () => {
    handleSearch("");
    if (searchInputRef.current) searchInputRef.current.value = "";
  };

  const handleAddEventClick = async () => {
    setAddOpen(true);
    if (fineTypes.length === 0) await fetchFineTypes();
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pt-8 pb-24 lg:pb-0">
      <EventsCacheLoader />

      {/* Page Header */}
      <PageHeader
        variant="admin"
        title="Events Management"
        context="2nd Semester · A.Y. 2025–2026"
        description="Manage your organisation's events and track attendance"
        action={
          <Button size="sm" className="gap-1.5" onClick={handleAddEventClick}>
            <Plus className="size-4" />
            Add Event
          </Button>
        }
      />

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={searchInputRef}
          type="text"                          
          placeholder="Search events by name or location…"
          className="pl-9 pr-9 h-10 bg-background"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
        {searchQuery && (
          <button
            onClick={() => handleSearch("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full
                      bg-[#C0DD97] hover:bg-[#97C459] flex items-center justify-center transition-colors"
          >
            <X className="h-3 w-3 text-[#3B6D11]" />
          </button>
        )}
      </div>

      {/* Tab navigation + content */}
      <Tabs value={currentTab} onValueChange={(v) => setCurrentTab(v as EventStatus)}>
        <EventsTabNavigation
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          loading={loading}
          isDesktop={!isMobile}
        />

        {/* Filters row */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-6">
          <EventsFilters
            onSetDate={handleDateChange}
            onSortBy={handleSort}
            viewMode={viewMode}
            onViewChange={handleViewModeChange}
            isDesktop={!isMobile}
          />
        </div>

        <TabsContent value={currentTab} className="mt-6">
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

      {/* Pagination */}
      {!loading && totalPages > 0 && !searchQuery && (
        <div className="flex justify-center mt-4">
          <EventsPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Add event dialog */}
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