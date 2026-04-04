import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

interface EventsPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function EventsPagination({
  currentPage,
  totalPages,
  onPageChange,
}: EventsPaginationProps) {
  // Generate page numbers with mobile-friendly limits
  const getPageNumbers = (isMobile: boolean) => {
    const pages = [];
    const maxVisiblePages = isMobile ? 3 : 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (isMobile) {
        start = Math.max(2, currentPage);
        end = Math.min(totalPages - 1, currentPage);
      }

      if (start === 2) end = Math.min(totalPages - 1, start + (isMobile ? 0 : 2));
      if (end === totalPages - 1) start = Math.max(2, end - (isMobile ? 0 : 2));

      if (start > 2) pages.push(-1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) pages.push(-2);

      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="flex justify-center items-center gap-1 sm:gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="h-9 w-9 sm:h-10 sm:w-10"
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </Button>

      {/* Mobile pagination */}
      <div className="flex items-center gap-1 sm:hidden">
        {getPageNumbers(true).map((page, i) => {
          if (page < 0) {
            return (
              <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground">
                …
              </span>
            );
          }

          return (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
              className="h-9 w-9 p-0 text-sm"
            >
              {page}
            </Button>
          );
        })}
      </div>

      {/* Desktop pagination */}
      <div className="hidden sm:flex items-center gap-1.5">
        {getPageNumbers(false).map((page, i) => {
          if (page < 0) {
            return (
              <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">
                …
              </span>
            );
          }

          return (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
              className="h-10 w-10 p-0"
            >
              {page}
            </Button>
          );
        })}
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="h-9 w-9 sm:h-10 sm:w-10"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}