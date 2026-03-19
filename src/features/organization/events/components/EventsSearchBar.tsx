import { SearchIcon, XIcon } from "lucide-react";

interface EventsSearchBarProps {
  searchQuery: string;
  resultsCount: number;
  onClear: () => void;
}

export function EventsSearchBar({
  searchQuery,
  resultsCount,
  onClear,
}: EventsSearchBarProps) {
  return (
    <div className="bg-[#C8E6C9]/30 dark:bg-[#1B5E20]/20 border border-[#A5D6A7] dark:border-[#1B5E20] rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#C8E6C9] dark:bg-[#1B5E20]/50 rounded-lg flex items-center justify-center">
            <SearchIcon className="h-4 w-4 text-[#1B5E20] dark:text-[#8BC34A]" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-[#1B5E20] dark:text-[#C8E6C9]">
                Search results for:
              </span>
              <span className="text-sm font-bold text-[#1B5E20] dark:text-[#C8E6C9] bg-[#C8E6C9] dark:bg-[#1B5E20] px-2 py-0.5 rounded">
                &quot;{searchQuery}&quot;
              </span>
            </div>
            <p className="text-xs text-[#2E7D32] dark:text-[#A5D6A7]">
              Found {resultsCount} event{resultsCount !== 1 ? "s" : ""} matching your search
            </p>
          </div>
        </div>
        <button
          onClick={onClear}
          className="w-8 h-8 bg-[#C8E6C9] dark:bg-[#1B5E20] hover:bg-[#A5D6A7] dark:hover:bg-[#2E7D32] rounded-lg flex items-center justify-center transition-colors text-[#1B5E20] dark:text-[#8BC34A]"
          title="Clear search"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}