import { Button } from "@/components/ui/button";
import { LayoutGridIcon, ListIcon } from "lucide-react";

export type ViewMode = "card" | "list";

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewChange: (mode: ViewMode) => void;
}

export function ViewToggle({ viewMode, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewChange("card")}
        className={`h-8 px-3 transition-all ${
          viewMode === "card"
            ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100"
            : "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
        }`}
      >
        <LayoutGridIcon className="h-4 w-4 mr-2" />
        Card
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewChange("list")}
        className={`h-8 px-3 transition-all ${
          viewMode === "list"
            ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100"
            : "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
        }`}
      >
        <ListIcon className="h-4 w-4 mr-2" />
        List
      </Button>
    </div>
  );
}
