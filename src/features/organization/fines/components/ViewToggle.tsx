"use client"

import { LayoutGrid, List } from "lucide-react"
import { Button } from "../../../../components/ui/button"
import { cn } from "@/lib/utils"

export type ViewMode = "table" | "card"

interface ViewToggleProps {
  viewMode: ViewMode
  onViewChange: (mode: ViewMode) => void
}

export function ViewToggle({ viewMode, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex rounded-md border border-border">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Table view"
        className={cn("size-9 rounded-r-none", viewMode === "table" && "bg-accent")}
        onClick={() => onViewChange("table")}
      >
        <List className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Card view"
        className={cn("size-9 rounded-l-none border-l border-border", viewMode === "card" && "bg-accent")}
        onClick={() => onViewChange("card")}
      >
        <LayoutGrid className="size-4" />
      </Button>
    </div>
  )
}
