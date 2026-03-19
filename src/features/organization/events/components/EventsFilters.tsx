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
import { CalendarIcon, X } from "lucide-react"
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

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* View Toggle — desktop only */}
      {isDesktop && <ViewToggle viewMode={viewMode} onViewChange={onViewChange} />}

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