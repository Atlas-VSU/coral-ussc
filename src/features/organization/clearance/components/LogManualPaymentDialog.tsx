"use client"

import { PenLine } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { ClearanceStatus } from "../types"

interface LogManualPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  target: ClearanceStatus | null
  selection: any // Using selection object from useManualPaymentSelection
  isProcessing: boolean
  onLogPayment: () => Promise<void>
}

export function LogManualPaymentDialog({
  open,
  onOpenChange,
  target,
  selection,
  isProcessing,
  onLogPayment
}: LogManualPaymentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Payment Manually — {target?.userName}</DialogTitle>
          <DialogDescription>{target?.studentId}</DialogDescription>
        </DialogHeader>

        {target && selection.items.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-foreground">Unsettled Items</p>
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={selection.toggleAll}
                >
                  {selection.selectedRefIds.size === selection.items.length ? "Deselect All" : "Select All"}
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                {selection.items.map((item: any) => (
                  <label
                    key={item.refId}
                    className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors has-[button[data-state=checked]]:border-primary/40 has-[button[data-state=checked]]:bg-primary/5"
                  >
                    <Checkbox
                      checked={selection.selectedRefIds.has(item.refId)}
                      onCheckedChange={() => selection.toggleItem(item.refId)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground leading-snug">{item.label}</p>
                      <Badge variant="outline" className="mt-1 text-[10px] capitalize">{item.type}</Badge>
                    </div>
                    <span className="text-sm font-semibold text-foreground shrink-0">₱{item.amount.toLocaleString()}</span>
                  </label>
                ))}
              </div>
            </div>

            {selection.selectedItems.length > 0 && (
              <>
                <Separator />
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    Selected ({selection.selectedItems.length} item{selection.selectedItems.length !== 1 ? "s" : ""})
                  </span>
                  <span className="text-base font-bold text-foreground">₱{selection.total.toLocaleString()}</span>
                </div>
              </>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            disabled={selection.selectedRefIds.size === 0 || isProcessing}
            className="gap-1.5 border-[#1B5E20]/40 bg-[#1B5E20] text-white hover:bg-[#2E7D32] dark:bg-green-700 dark:hover:bg-green-600"
            onClick={onLogPayment}
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                Logging Payment...
              </>
            ) : (
              <>
                <PenLine className="size-3.5" />
                Log Payment
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
