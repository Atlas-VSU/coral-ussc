"use client"

import { Download } from "lucide-react"
import { SearchInput } from "@/components/organization/SearchInput"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ViewToggle } from "@/components/organization/ViewToggle"
import type { ViewMode } from "@/components/organization/ViewToggle"
import { CardTitle } from "@/components/ui/card"

interface ClearanceFiltersProps {
  search: string
  onSearchChange: (v: string) => void
  filterStatus: string
  onFilterChange: (v: string) => void
  onExport: () => void
  viewMode: ViewMode
  onViewChange: (v: ViewMode) => void
}

export function ClearanceFilters({
  search,
  onSearchChange,
  filterStatus,
  onFilterChange,
  onExport,
  viewMode,
  onViewChange,
}: ClearanceFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
          Clearance Records
        </CardTitle>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          placeholder="Search student..."
          value={search}
          onChange={onSearchChange}
          className="w-full sm:w-56"
        />
        <Select value={filterStatus} onValueChange={onFilterChange}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="cleared">Cleared</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="not_cleared">Not Cleared</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={onExport}>
          <Download className="size-4" /> Export
        </Button>
        <ViewToggle viewMode={viewMode} onViewChange={onViewChange} />
      </div>
    </div>
  )
}