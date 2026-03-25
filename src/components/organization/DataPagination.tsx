"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

interface DataPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  hasNextPage?: boolean
}

export function DataPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  hasNextPage,
}: DataPaginationProps) {
  if (totalPages <= 1) return null

  const from = (currentPage - 1) * itemsPerPage + 1
  const to = Math.min(currentPage * itemsPerPage, totalItems)

  const getPageNumbers = () => {
    const pages: number[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      let start = Math.max(2, currentPage - 1)
      let end = Math.min(totalPages - 1, currentPage + 1)
      if (start === 2) end = Math.min(totalPages - 1, start + 2)
      if (end === totalPages - 1) start = Math.max(2, end - 2)
      if (start > 2) pages.push(-1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (end < totalPages - 1) pages.push(-2)
      pages.push(totalPages)
    }

    return pages
  }

  return (
    <div className="flex flex-col items-center gap-2 mt-4 sm:flex-row sm:justify-between">
      <p className="text-xs text-muted-foreground">
        Showing {from}–{to} of {totalItems} items
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>

        {getPageNumbers().map((page, i) => {
          if (page < 0) {
            return (
              <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground text-sm">
                …
              </span>
            )
          }
        })}

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || hasNextPage === false}
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}