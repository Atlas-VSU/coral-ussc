"use client"

import { useState, useEffect, useRef } from "react"
import { Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/shared/PageHeader"
import { useIsMobile } from "@/hooks/useIsMobile"
import type { TabValue } from "@/features/organization/events/components/EventsTabNavigation"
import { useEventsData } from "@/features/organization/events/hooks/useEventsData" 
import { EventsList } from "@/features/organization/events/components/EventsList"
import { EventsTabNavigation } from "@/features/organization/events/components/EventsTabNavigation"
import { EventsFilters } from "@/features/organization/events/components/EventsFilters"
import { EventsPagination } from "@/features/organization/events/components/EventsPagination"
import { AddEventDialog } from "@/features/organization/events/components/AddEventDialog"
import { EventsSearchBar } from "@/features/organization/events/components/EventsSearchBar"
import { EventsSkeletonLoader } from "@/features/organization/events/components/EventsSkeletonLoader"
import type { ViewMode } from "@/features/organization/events/components/ViewToggle"

export default function EventsPage() {
  const [addOpen, setAddOpen] = useState(false)
  const [currentTab, setCurrentTab] = useState<TabValue>("ongoing")

  const [viewMode, setViewMode] = useState<ViewMode>("card")
  const isMobile = useIsMobile()
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isMobile) {
      setViewMode("list")
    } else {
      const savedViewMode = localStorage.getItem("eventsViewMode") as ViewMode
      if (savedViewMode && (savedViewMode === "card" || savedViewMode === "list")) {
        setViewMode(savedViewMode)
      }
    }
  }, [isMobile])

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    if (!isMobile) {
      localStorage.setItem("eventsViewMode", mode)
    }
  }

  // Real Data Fetching Hook (React Query behind the scenes)
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
  } = useEventsData(currentTab)

  const clearSearch = () => {
    handleSearch("")
    if (searchInputRef.current) searchInputRef.current.value = ""
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-8">
      {/* Page Header */}
      <PageHeader
        variant="admin"
        title="Events Management"
        context="2nd Semester · A.Y. 2025–2026"
        description="Manage your organisation's events and track attendance"
        action={
          <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
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
          type="search"
          placeholder="Search events by name or location…"
          className="pl-9 h-10 bg-background"
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {/* Active search banner */}
      {searchQuery && (
        <EventsSearchBar
          searchQuery={searchQuery}
          resultsCount={totalEvents} // Now using the real total from the DB
          onClear={clearSearch}
        />
      )}

      {/* Tab navigation */}
      <EventsTabNavigation
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        isDesktop={!isMobile}
      />

      {/* Filters row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <EventsFilters
          onSetDate={handleDateChange}
          onSortBy={handleSort}
          viewMode={viewMode}
          onViewChange={setViewMode}
          isDesktop={!isMobile}
        />
      </div>

      {/* Main Events list */}  
      {loading ? (
        <EventsSkeletonLoader viewMode={viewMode} />
      ) : (
        <EventsList
          events={events}
          onEventsUpdate={refresh}
          viewMode={viewMode}
        />
      )}

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
        onEventAdded={() => {
          refresh() 
          setAddOpen(false)
        }}
      />
    </div>
  )
}