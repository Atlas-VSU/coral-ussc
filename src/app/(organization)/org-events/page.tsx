"use client";

import { useState, useEffect } from "react";
import { EventsList } from "@/features/organization/events/components/EventsList";
import { EventsHeader } from "@/features/organization/events/components/EventsHeader";
import { EventsFilters } from "@/features/organization/events/components/EventsFilters";
import { EventsPagination } from "@/features/organization/events/components/EventsPagination";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useMediaQuery } from "@/hooks/use-media-query";
import { EventsSkeletonLoader } from "@/features/organization/events/components/EventsSkeletonLoader";
import { EventsSearchBar } from "@/features/organization/events/components/EventsSearchBar";
import { EventsCacheLoader } from "@/features/organization/events/services/eventsCacheLoader";
import {
  EventsTabNavigation,
  EventStatus,
} from "@/features/organization/events/components/EventsTabNavigation";
import { useEventsData } from "@/features/organization/events/hooks/useEventsData";
import { ViewMode } from "@/features/organization/events/components/ViewToggle";

export default function EventsPage() {
  const [currentTab, setCurrentTab] = useState<EventStatus>("ongoing");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("card");

  // Check if screen is mobile
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Load saved view mode from localStorage, but force list view on mobile
  useEffect(() => {
    if (!isDesktop) {
      // Force list view on mobile
      setViewMode("list");
    } else {
      // Load saved view mode on desktop
      const savedViewMode = localStorage.getItem("eventsViewMode") as ViewMode;
      if (
        savedViewMode &&
        (savedViewMode === "card" || savedViewMode === "list")
      ) {
        setViewMode(savedViewMode);
      }
    }
  }, [isDesktop]);

  // Save view mode to localStorage when changed (only on desktop)
  const handleViewModeChange = (mode: ViewMode) => {
    if (isDesktop) {
      setViewMode(mode);
      localStorage.setItem("eventsViewMode", mode);
    }
  };

  // Use the updated hook with server-side pagination
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

  // Handle search activation/deactivation
  const onSearch = (query: string) => {
    handleSearch(query);
    setIsSearchActive(!!query.trim());
  };

  // Clear search
  const clearSearch = () => {
    handleSearch("");
    setIsSearchActive(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Invisible component that preloads the events cache */}
      <EventsCacheLoader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8 animate-fade-in-up animation-delay-200">
          <EventsHeader
            onSearch={onSearch}
            onEventAdded={() => {
              // Refresh the events list after adding a new event
              refresh();
            }}
          />
        </div>

        {/* Search results indicator */}
        {isSearchActive && (
          <div className="mb-6 animate-fade-in-up animation-delay-300">
            <EventsSearchBar
              searchQuery={searchQuery}
              resultsCount={totalEvents}
              onClear={clearSearch}
            />
          </div>
        )}

        {/* Filters Section */}
        <div className="mb-6 animate-fade-in-up animation-delay-400">
          <EventsFilters
            onSetDate={handleDateChange}
            onSortBy={handleSort}
            disabled={loading}
            viewMode={viewMode}
            onViewChange={handleViewModeChange}
          />
        </div>

        {/* Main Content */}
        {isSearchActive ? (
          // Search results view - no tabs, no pagination
          <div className="space-y-6 animate-fade-in-up animation-delay-600">
            {loading ? (
              <EventsSkeletonLoader viewMode={viewMode} />
            ) : (
              <EventsList
                events={events}
                onEventsUpdate={refresh}
                viewMode={viewMode}
              />
            )}
          </div>
        ) : (
          // Normal tabbed view with pagination
          <div className="space-y-6 animate-fade-in-up animation-delay-600">
            <Tabs
              value={currentTab}
              className="w-full"
              onValueChange={(value) => setCurrentTab(value as EventStatus)}
            >
              <EventsTabNavigation
                currentTab={currentTab}
                setCurrentTab={setCurrentTab}
                loading={loading}
                isDesktop={isDesktop}
              />

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
          </div>
        )}

        {/* Pagination */}
        {!loading && totalEvents > 0 && !isSearchActive && (
          <div className="mt-8 flex justify-center animate-fade-in-up animation-delay-800">
            <EventsPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
