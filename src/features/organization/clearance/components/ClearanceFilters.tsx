"use client"

import { Download, RefreshCcw, Search } from "lucide-react"
import { SearchInput } from "@/components/organization/SearchInput"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ViewToggle } from "@/components/organization/ViewToggle"
import type { ViewMode } from "@/components/organization/ViewToggle"
import { CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"

interface ClearanceFiltersProps {
  search: string
  onSearchChange: (v: string) => void
  filterStatus: string
  onFilterChange: (v: string) => void
  onExport: () => void
  viewMode: ViewMode
  onViewChange: (v: ViewMode) => void
  onRefresh: () => void
  isLoading?: boolean
  currentPage: number
  totalPages: number
}

export function ClearanceFilters({
  search,
  onSearchChange,
  filterStatus,
  onFilterChange,
  onExport,
  viewMode,
  onViewChange,
  onRefresh,
  isLoading,
  currentPage,
  totalPages,
}: ClearanceFiltersProps) {

  const [localSearch, setLocalSearch] = useState(search);
  useEffect(() => {
    setLocalSearch(search)
  }, [search])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(localSearch)
   }
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
          Clearance Records
        </CardTitle>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <SearchInput
                placeholder="Search by name or ID..."
                value={localSearch}
                onChange={v => setLocalSearch(v)} // Only update local state on keystroke
                className="w-full sm:w-64"
              />
              <Button type="submit" variant="secondary" size="icon" disabled={isLoading}>
                <Search className="h-4 w-4" />
                <span className="sr-only">Search</span>
              </Button>
            </form>
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
        <Button onClick={onRefresh} variant="outline" size="sm" className="gap-1.5" disabled={isLoading}>
          <RefreshCcw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={onExport}>
          <Download className="size-4" /> Export
        </Button>
        <ViewToggle viewMode={viewMode} onViewChange={onViewChange} />
      </div>
    </div>
  )
}