"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

interface EventsPaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function EventsPagination({ currentPage, totalPages, onPageChange }: EventsPaginationProps) {
  if (totalPages <= 1) return null

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
    <div className="flex justify-center items-center mt-6 gap-1">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </Button>

      {getPageNumbers().map((page, i) => {
        if (page < 0) {
          return <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground">…</span>
        }
        return (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        )
      })}

      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRightIcon className="h-4 w-4" />
      </Button>
    </div>
  )
}
