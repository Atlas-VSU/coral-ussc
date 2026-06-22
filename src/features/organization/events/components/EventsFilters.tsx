"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { CalendarIcon, X, SlidersHorizontal } from "lucide-react"
import { format } from "date-fns"
import { ViewToggle, ViewMode } from "./ViewToggle"

interface EventsFiltersProps {
  onSetDate: (date: Date | undefined) => void
  onSortBy: (sortBy: string) => void
  viewMode: ViewMode
  onViewChange: (mode: ViewMode) => void
  isDesktop: boolean
  disabled?: boolean
  currentSortBy?: string
}

export function EventsFilters({
  onSetDate,
  onSortBy,
  viewMode,
  onViewChange,
  isDesktop,
  disabled = false,
  currentSortBy = "date-desc",
}: EventsFiltersProps) {
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [sortBy, setSortBy] = useState<string>(currentSortBy)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleDateChange = (newDate: Date | undefined) => {
    setDate(newDate)
    onSetDate(newDate)
  }

  const handleSortByChange = (newSortBy: string) => {
    setSortBy(newSortBy)
    onSortBy(newSortBy)
  }

  const hasActiveFilters = !!date || sortBy !== "date-desc"

  const clearAll = () => {
    handleDateChange(undefined)
    handleSortByChange("date-desc")
  }

  // Desktop layout
  if (isDesktop) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <ViewToggle viewMode={viewMode} onViewChange={onViewChange} />

        {/* Date filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="h-9 gap-2 text-sm"
              disabled={disabled}
            >
              <CalendarIcon className="h-4 w-4" />
              {date ? format(date, "MMM dd, yyyy") : "Filter by date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateChange}
              autoFocus
            />
            {date && (
              <div className="p-3 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-sm"
                  onClick={() => handleDateChange(undefined)}
                >
                  Clear date filter
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Sort selector */}
        <Select value={sortBy} onValueChange={handleSortByChange} disabled={disabled}>
          <SelectTrigger className="h-9 w-full sm:w-45 text-sm">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-desc">Newest first</SelectItem>
            <SelectItem value="date-asc">Oldest first</SelectItem>
            <SelectItem value="name-asc">Name (A–Z)</SelectItem>
            <SelectItem value="name-desc">Name (Z–A)</SelectItem>
            <SelectItem value="attendees-desc">Most attendees</SelectItem>
            <SelectItem value="attendees-asc">Least attendees</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear all */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 gap-1.5 text-sm"
            onClick={clearAll}
            disabled={disabled}
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>
    )
  }

  // Mobile layout - Filter button that opens drawer
  return (
    <div className="flex items-center gap-2">
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-10 gap-2 flex-1"
            disabled={disabled}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {(date ? 1 : 0) + (sortBy !== "date-desc" ? 1 : 0)}
              </span>
            )}
          </Button>
        </DrawerTrigger>
        <DrawerContent className="h-[90vh] flex flex-col p-0 gap-0">
          <DrawerHeader className="border-b pb-4 shrink-0">
            <div className="flex items-center justify-between">
              <DrawerTitle>Filters</DrawerTitle>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="h-8 text-xs"
                >
                  Clear all
                </Button>
              )}
            </div>
          </DrawerHeader>

          {/* Scrollable body — prevents content (esp. the Apply button) from being clipped on short screens */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-6">
            {/* Sort by */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Sort by</label>
              <Select value={sortBy} onValueChange={handleSortByChange}>
                <SelectTrigger className="w-full h-12 text-base">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Newest first</SelectItem>
                  <SelectItem value="date-asc">Oldest first</SelectItem>
                  <SelectItem value="name-asc">Name (A–Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z–A)</SelectItem>
                  <SelectItem value="attendees-desc">Most attendees</SelectItem>
                  <SelectItem value="attendees-asc">Least attendees</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Filter by date</label>
              <div className="border rounded-lg overflow-hidden flex justify-center">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={handleDateChange}
                  className="w-full"
                />
              </div>
              {date && (
                <div className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                  <span className="text-sm">
                    Selected: <strong>{format(date, "MMMM dd, yyyy")}</strong>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDateChange(undefined)}
                    className="h-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Pinned footer so Apply is always reachable, even on short screens */}
          <div className="shrink-0 border-t p-4 bg-background">
            <Button
              className="w-full h-12 text-base font-semibold"
              onClick={() => setDrawerOpen(false)}
            >
              Apply Filters
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Quick date indicator on mobile */}
      {date && (
        <Button
          variant="outline"
          size="sm"
          className="h-10 gap-1.5 shrink-0"
          onClick={() => handleDateChange(undefined)}
        >
          <CalendarIcon className="h-3.5 w-3.5" />
          {format(date, "MMM dd")}
          <X className="h-3 w-3 ml-1" />
        </Button>
      )}
    </div>
  )
}