"use client"

import { Button } from "@/components/ui/button"
import { LayoutGridIcon, ListIcon } from "lucide-react"

export type ViewMode = "card" | "list"

interface ViewToggleProps {
  viewMode: ViewMode
  onViewChange: (mode: ViewMode) => void
}

export function ViewToggle({ viewMode, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center bg-muted rounded-lg p-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewChange("card")}
        className={`h-8 px-3 transition-all ${
          viewMode === "card"
            ? "bg-background shadow-sm text-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <LayoutGridIcon className="h-4 w-4 mr-1.5" />
        Card
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewChange("list")}
        className={`h-8 px-3 transition-all ${
          viewMode === "list"
            ? "bg-background shadow-sm text-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <ListIcon className="h-4 w-4 mr-1.5" />
        List
      </Button>
    </div>
  )
}