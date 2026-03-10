import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SearchIcon, XIcon, PencilIcon, CheckIcon } from "lucide-react";
import { StudentIdInput } from "@/components/ui/student-id-input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface SearchByIdFormProps {
  studentId: string;
  setStudentId: (id: string) => void;
  handleSearch: () => void;
  handleAutoSearch?: () => void; // Auto-search for completion
  isSubmitting: boolean;
  searchStatus:
    | "idle"
    | "loading"
    | "success"
    | "error"
    | "success-different-organization"
    | "success-different-faculty"
    | "not-found"
    | "invalid-format";
  successMessage: string | null;
  showLabel?: boolean;
  handleKeyDown?: (e: React.KeyboardEvent) => void;
}

export function SearchByIdForm({
  studentId,
  setStudentId,
  handleSearch,
  handleAutoSearch,
  isSubmitting,
  searchStatus,
  successMessage,
  showLabel = false,
  handleKeyDown,
}: SearchByIdFormProps) {
  const isLoading = searchStatus === "loading";
  const isDisabled =
    isSubmitting ||
    isLoading ||
    (searchStatus === "success" && !successMessage);

  const [sheetOpen, setSheetOpen] = useState(false);

  const handleClear = () => {
    setStudentId("");
  };

  // Create a default key down handler if none is provided
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (handleKeyDown) {
      handleKeyDown(e);
    } else if (e.key === "Enter" && !isDisabled && studentId.trim()) {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div>
      {showLabel && (
        <label
          htmlFor="student-id"
          className="font-nunito-sans text-sm font-semibold text-gray-900 dark:text-gray-100 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block mb-3"
        >
          Enter Student ID
        </label>
      )}

      {/* ── Mobile: tap-to-open sheet ── */}
      <div className="sm:hidden space-y-3">
        <button
          type="button"
          disabled={isDisabled}
          onClick={() => setSheetOpen(true)}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-primary/60 dark:hover:border-primary/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="font-nunito-sans font-bold text-lg tracking-[0.25em] text-gray-800 dark:text-gray-100">
            {studentId ? (
              studentId
            ) : (
              <span className="text-gray-400 dark:text-gray-500 font-medium text-sm tracking-normal">
                Tap to enter Student ID
              </span>
            )}
          </span>
          <PencilIcon className="h-4 w-4 text-muted-foreground shrink-0" />
        </button>

        <div className="flex gap-2">
          <Button
            type="button"
            onClick={handleClear}
            disabled={isDisabled || !studentId.trim()}
            variant="outline"
            className="h-11 flex-1 font-nunito-sans font-semibold border-gray-300 dark:border-gray-600"
          >
            <XIcon className="h-4 w-4 mr-2" />
            Clear
          </Button>
          <Button
            type="button"
            onClick={handleSearch}
            disabled={isDisabled || !studentId.trim()}
            className="h-11 flex-[2] font-nunito-sans font-semibold bg-primary hover:bg-primary/90 shadow-sm"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <span className="h-4 w-4 border-2 border-current border-t-transparent animate-spin rounded-full mr-2"></span>
                Checking
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <SearchIcon className="h-4 w-4 mr-2" />
                Find
              </span>
            )}
          </Button>
        </div>

        {/* Bottom Sheet */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent
            side="bottom"
            className="rounded-t-2xl px-6 pb-8 pt-6 max-h-[85dvh] overflow-y-auto"
          >
            <SheetHeader className="mb-6 text-left">
              <SheetTitle className="font-nunito-sans text-lg">
                Enter Student ID
              </SheetTitle>
              <SheetDescription className="font-nunito-sans text-sm">
                Tap each cell and type the digit. Use the keypad below.
              </SheetDescription>
            </SheetHeader>

            <StudentIdInput
              value={studentId}
              onChange={setStudentId}
              onComplete={(val) => {
                (handleAutoSearch || handleSearch)?.();
              }}
              disabled={isDisabled}
              size="lg"
              autoFocus
              onKeyDown={onKeyDown}
              className="mb-8 w-full"
            />

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={() => {
                  handleClear();
                }}
                disabled={isDisabled || !studentId.trim()}
                variant="outline"
                className="h-12 flex-1 font-nunito-sans font-semibold border-gray-300 dark:border-gray-600 text-base"
              >
                <XIcon className="h-4 w-4 mr-2" />
                Clear
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setSheetOpen(false);
                  handleSearch();
                }}
                disabled={isDisabled || !studentId.trim()}
                className="h-12 flex-[2] font-nunito-sans font-semibold bg-primary hover:bg-primary/90 shadow-sm text-base"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <span className="h-5 w-5 border-2 border-current border-t-transparent animate-spin rounded-full mr-2"></span>
                    Checking
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <CheckIcon className="h-5 w-5 mr-2" />
                    Confirm & Find
                  </span>
                )}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* ── Desktop: existing inline layout (unchanged) ── */}
      <div className="hidden sm:flex sm:flex-row sm:items-start sm:space-x-2">
        <div className="flex-1">
          <StudentIdInput
            value={studentId}
            onChange={setStudentId}
            onComplete={handleAutoSearch || handleSearch}
            disabled={isDisabled}
            className="w-full"
            autoFocus
            onKeyDown={onKeyDown}
          />
        </div>
        <div className="sm:pt-1 flex gap-2 sm:w-auto">
          <Button
            type="button"
            onClick={handleClear}
            disabled={isDisabled || !studentId.trim()}
            variant="outline"
            className="h-10 px-4 font-nunito-sans font-semibold border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 sm:flex-none sm:min-w-[80px] flex-shrink-0"
          >
            <XIcon className="h-4 w-4" />
            <span className="ml-2 hidden sm:inline">Clear</span>
          </Button>
          <Button
            type="button"
            onClick={handleSearch}
            disabled={isDisabled || !studentId.trim()}
            className="h-10 px-6 font-nunito-sans font-semibold bg-primary hover:bg-primary/90 shadow-sm sm:flex-none sm:min-w-[120px] flex-shrink-0"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <span className="h-4 w-4 border-2 border-current border-t-transparent animate-spin rounded-full mr-2"></span>
                <span className="text-sm">Checking</span>
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <SearchIcon className="h-4 w-4 mr-2" />
                <span className="text-sm">Find</span>
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
