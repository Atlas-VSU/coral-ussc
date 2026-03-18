import { Button } from "@/components/ui/button";
import { LayoutGridIcon, ListIcon } from "lucide-react";

export type ViewMode = "card" | "table";

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewChange: (mode: ViewMode) => void;
}

export function ViewToggle({ viewMode, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center bg-gray-100 rounded-lg p-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewChange("card")}
        className={`h-8 px-3 transition-all ${
          viewMode === "card"
            ? "bg-white shadow-sm text-gray-900"
            : "hover:bg-gray-200 text-gray-600"
        }`}
      >
        <LayoutGridIcon className="h-4 w-4 mr-2" />
        Card
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewChange("table")}
        className={`h-8 px-3 transition-all ${
          viewMode === "table"
            ? "bg-white shadow-sm text-gray-900"
            : "hover:bg-gray-200 text-gray-600"
        }`}
      >
        <ListIcon className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">Table</span>
        <span className="sm:hidden">List</span>
      </Button>
    </div>
  );
}
