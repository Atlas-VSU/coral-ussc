"use client"

import { Download, RefreshCcw, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ViewToggle } from "@/components/organization/general/ViewToggle"
import type { ViewMode } from "@/components/organization/general/ViewToggle"
import { Input } from "@/components/ui/input"
import { useMediaQuery } from "@/hooks/use-media-query"

interface ClearanceFiltersProps {
  searchTerm: string                         
  onSearchChange: (value: string) => void    
  onSearchCommit: () => void                
  onSearchClear: () => void                 
  filterStatus: string
  onFilterChange: (v: string) => void
  viewMode: ViewMode
  onViewChange: (v: ViewMode) => void
  onRefresh: () => void
  onExport: () => void
  isExporting?: boolean
  isLoading?: boolean
  disabled?: boolean
}

export function ClearanceFilters({
  searchTerm,
  onSearchChange,
  onSearchCommit,
  onSearchClear,
  filterStatus,
  onFilterChange,
  viewMode,
  onViewChange,
  onRefresh,
  onExport,
  isExporting = false,
  isLoading,
  disabled = false,
}: ClearanceFiltersProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  const lightSelectTriggerClass =
    "bg-white text-black border-gray-200 hover:bg-green-50 focus:ring-green-200"
  const lightSelectContentClass = "bg-white text-black border-gray-200"
  const lightSelectItemClass = "text-black focus:bg-green-50 focus:text-black"

  const handleClearAll = () => {
    onSearchClear()
    onFilterChange("all")
  }

  const hasActiveFilters = searchTerm || filterStatus !== "all"

  const SearchInput = (
    <div className="relative flex-1 min-w-[200px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
      <Input
        placeholder="Search by name or ID… then press Enter"
        className="pl-10 pr-10 h-9 border-gray-200"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            onSearchCommit()
          }
        }}
        disabled={disabled || isLoading}
      />
      {searchTerm && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 text-gray-400 hover:text-black"
          onClick={onSearchClear}
          disabled={disabled || isLoading}
          type="button"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )

  return (
    <div className="bg-white rounded-lg border shadow-sm p-3 sm:p-4">

      {/* ── Mobile / Tablet layout ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 lg:hidden">
        <div>
          <h3 className="text-sm font-medium text-green-800 mb-1">
            Search & Filter Clearance
          </h3>
          <p className="text-xs text-gray-500 hidden sm:block">
            Find clearance records by name, ID, or filter by status
          </p>
        </div>

        {SearchInput}

        <Select
          value={filterStatus}
          onValueChange={onFilterChange}
          disabled={disabled || isLoading}
        >
          <SelectTrigger className={`w-full h-10 ${lightSelectTriggerClass}`}>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className={lightSelectContentClass}>
            <SelectItem value="all" className={lightSelectItemClass}>
              All Status
            </SelectItem>
            <SelectItem value="cleared" className={lightSelectItemClass}>
              Cleared
            </SelectItem>
            <SelectItem value="pending" className={lightSelectItemClass}>
              Pending
            </SelectItem>
            <SelectItem value="not_cleared" className={lightSelectItemClass}>
              Not Cleared
            </SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={disabled || isLoading}
          className="w-full h-10"
        >
          <RefreshCcw className={`h-4 w-4 mr-2 ${(disabled || isLoading) ? 'animate-spin' : ''}`} />
          Refresh
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          disabled={disabled || isLoading || isExporting}
          className="w-full h-10"
        >
          <Download className={`h-4 w-4 mr-2 ${isExporting ? 'animate-bounce' : ''}`} />
          {isExporting ? "Exporting…" : "Export CSV"}
        </Button>

        {hasActiveFilters && (
          <div className="pt-2 border-t border-gray-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              disabled={disabled || isLoading}
              className="w-full text-xs h-9 text-black hover:bg-green-100 hover:text-black justify-center"
            >
              Clear all filters
            </Button>
          </div>
        )}
      </div>

      <div className="hidden lg:flex lg:flex-col lg:gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="shrink-0">
          <h3 className="text-sm font-medium text-green-800 mb-1">
            Search & Filter Clearance
          </h3>
          <p className="text-xs text-gray-500">
            Find clearance records by name, ID, or filter by status
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 flex-1 xl:justify-end">
          {SearchInput}

          {isDesktop && (
            <ViewToggle viewMode={viewMode} onViewChange={onViewChange} />
          )}

          <Select
            value={filterStatus}
            onValueChange={onFilterChange}
            disabled={disabled || isLoading}
          >
            <SelectTrigger className={`w-[140px] h-9 ${lightSelectTriggerClass}`}>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className={lightSelectContentClass}>
              <SelectItem value="all" className={lightSelectItemClass}>
                All Status
              </SelectItem>
              <SelectItem value="cleared" className={lightSelectItemClass}>
                Cleared
              </SelectItem>
              <SelectItem value="pending" className={lightSelectItemClass}>
                Pending
              </SelectItem>
              <SelectItem value="not_cleared" className={lightSelectItemClass}>
                Not Cleared
              </SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={disabled || isLoading}
            className="h-9 px-3"
          >
            <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            disabled={disabled || isLoading || isExporting}
            className="h-9 px-3"
          >
            <Download className={`h-4 w-4 mr-2 ${isExporting ? 'animate-bounce' : ''}`} />
            {isExporting ? "Exporting…" : "Export CSV"}
          </Button>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              disabled={disabled || isLoading}
              className="text-xs h-9 px-3 text-black hover:bg-green-100 hover:text-black"
            >
              Clear all
            </Button>
          )}
        </div>
      </div>

    </div>
  )
}