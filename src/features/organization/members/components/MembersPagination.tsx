import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MembersPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function MembersPagination({
  currentPage,
  totalPages,
  onPageChange,
}: MembersPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center mt-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm p-3">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Page Navigation */}
          <nav className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="h-9 w-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;

                // Logic for showing relevant page numbers
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                  if (i === 4) pageNum = totalPages;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                  if (i === 0) pageNum = 1;
                } else {
                  pageNum = currentPage - 2 + i;
                  if (i === 0) pageNum = 1;
                  if (i === 4) pageNum = totalPages;
                }

                // Add ellipsis indicator
                if (
                  (i === 1 && pageNum > 2) ||
                  (i === 3 && pageNum < totalPages - 1)
                ) {
                  return (
                    <span key={`ellipsis-${i}`} className="px-2 py-1 text-gray-500 dark:text-gray-400 text-sm">
                      ...
                    </span>
                  );
                }

                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? "default" : "ghost"}
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                    className={`h-9 w-9 p-0 text-sm ${
                      pageNum === currentPage
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="h-9 w-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </nav>

          {/* Page Dropdown for quick navigation */}
          {totalPages > 5 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Go to:</span>
              <Select
                value={currentPage.toString()}
                onValueChange={(value) => onPageChange(parseInt(value))}
              >
                <SelectTrigger className="w-20 h-9 text-sm border-gray-300 dark:border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Page Info */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </div>
        </div>
      </div>
    </div>
  );
}
