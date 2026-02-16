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
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
            <SearchIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Search results for:
              </span>
              <span className="text-sm font-bold text-blue-800 dark:text-blue-200 bg-blue-100 dark:bg-blue-800 px-2 py-0.5 rounded">
                &quot;{searchQuery}&quot;
              </span>
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Found {resultsCount} event{resultsCount !== 1 ? 's' : ''} matching your search
            </p>
          </div>
        </div>
        <button
          onClick={onClear}
          className="w-8 h-8 bg-blue-100 dark:bg-blue-800 hover:bg-blue-200 dark:hover:bg-blue-700 rounded-lg flex items-center justify-center transition-colors text-blue-600 dark:text-blue-400"
          title="Clear search"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
