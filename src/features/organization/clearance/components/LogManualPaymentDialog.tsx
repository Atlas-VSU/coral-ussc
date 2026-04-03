"use client"

import { PenLine, CreditCard, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LoadingButton } from "@/components/ui/loading-button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { ClearanceStatus } from "../types"
import { useState, useEffect } from "react"

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
  

  // Reset states when dialog opens
  useEffect(() => {
    if (open) {
      selection.clearSelection();
    }
  }, [open]);

  // Group items by type
  const groupedItems = {
    fees: selection.items.filter((item: any) => item.type.toLowerCase().includes('fee')),
    fines: selection.items.filter((item: any) => item.type.toLowerCase().includes('fine')),
    other: selection.items.filter((item: any) => 
      !item.type.toLowerCase().includes('fee') && 
      !item.type.toLowerCase().includes('fine')
    )
  }

  const hasFees = groupedItems.fees.length > 0
  const hasFines = groupedItems.fines.length > 0
  const hasOther = groupedItems.other.length > 0

  
  const isAllFeesChecked = hasFees && groupedItems.fees.every((item: any) => selection.selectedRefIds.has(item.refId));
  const isAllFinesChecked = hasFines && groupedItems.fines.every((item: any) => selection.selectedRefIds.has(item.refId));


  const getGroupTotals = () => {
    const feesTotal = groupedItems.fees
      .filter((item: any) => selection.selectedRefIds.has(item.refId))
      .reduce((sum: number, item: any) => sum + item.amount, 0)
    
    const finesTotal = groupedItems.fines
      .filter((item: any) => selection.selectedRefIds.has(item.refId))
      .reduce((sum: number, item: any) => sum + item.amount, 0)
    
    const otherTotal = groupedItems.other
      .filter((item: any) => selection.selectedRefIds.has(item.refId))
      .reduce((sum: number, item: any) => sum + item.amount, 0)
    
    return { feesTotal, finesTotal, otherTotal }
  }

  const handleSelectAllFees = () => {
    const nextState = !isAllFeesChecked;
    groupedItems.fees.forEach((item: any) => {
      const isCurrentlySelected = selection.selectedRefIds.has(item.refId);
      if (nextState !== isCurrentlySelected) {
        selection.toggleItem(item.refId);
      }
    });
  }

  const handleSelectAllFines = () => {
    const nextState = !isAllFinesChecked;
    groupedItems.fines.forEach((item: any) => {
      const isCurrentlySelected = selection.selectedRefIds.has(item.refId);
      if (nextState !== isCurrentlySelected) {
        selection.toggleItem(item.refId);
      }
    });
  }

  const groupTotals = getGroupTotals()

  // Selection states
  const totalItemsCount = selection.items.length;
  const selectedCount = selection.selectedRefIds.size;
  const isAllSelected = totalItemsCount > 0 && selectedCount === totalItemsCount;
  const isAnySelected = selectedCount > 0;

  const handleToggleAll = () => {
    if (isAllSelected) {
      // Deselect everything
      selection.clearSelection();
    } else {
      // Select everything that isn't already selected
      selection.items.forEach((item: any) => {
        if (!selection.selectedRefIds.has(item.refId)) {
          selection.toggleItem(item.refId);
        }
      });
    }
  };

  const renderItem = (item: any, index: number) => {
    const isFee = item.type.toLowerCase().includes('fee')
    const isFine = item.type.toLowerCase().includes('fine')
    
    return (
      <label
        key={item.refId}
        className={cn(
          "flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors",
          "hover:bg-muted/40",
          "has-[button[data-state=checked]]:border-primary/40 has-[button[data-state=checked]]:bg-primary/5",
          isFee && "has-[button[data-state=checked]]:border-[#1B5E20]/40 has-[button[data-state=checked]]:bg-[#1B5E20]/5",
          isFine && "has-[button[data-state=checked]]:border-destructive/40 has-[button[data-state=checked]]:bg-destructive/5"
        )}
      >
        {/* <Checkbox
          checked={selection.selectedRefIds.has(item.refId)}
          onCheckedChange={() => {}}
          disabled
          className={cn(
            isFee && "data-[state=checked]:bg-[#1B5E20] data-[state=checked]:border-[#1B5E20]",
            isFine && "data-[state=checked]:bg-destructive data-[state=checked]:border-destructive"
          )}
        /> */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isFee && <CreditCard className="size-3.5 text-[#1B5E20]" />}
            {isFine && <AlertCircle className="size-3.5 text-destructive" />}
            <p className="text-sm font-medium text-foreground leading-snug">{item.label}</p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className={cn(
              "text-[10px] capitalize",
              isFee && "border-[#1B5E20]/20 text-[#1B5E20] bg-[#1B5E20]/5",
              isFine && "border-destructive/20 text-destructive bg-destructive/5"
            )}>
              {item.type}
            </Badge>
            {item.details && (
              <span className="text-[10px] text-muted-foreground">{item.details}</span>
            )}
          </div>
        </div>
        <span className={cn(
          "text-sm font-semibold shrink-0",
          isFee && "text-[#1B5E20]",
          isFine && "text-destructive"
        )}>
          ₱{item.amount.toLocaleString()}
        </span>
      </label>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Payment Manually — {target?.userName}</DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <span>{target?.studentId}</span>
            {target?.academicYear && (
              <>
                <span>•</span>
                <span>{target.academicYear}</span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {target && selection.items.length > 0 && (
          <div className="flex flex-col gap-4">
            {/* Selection Controls */}
            <div className="flex items-center justify-between bg-muted/30 px-3 py-2 rounded-lg border border-border/50">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground">
                  Unsettled Items
                </p>
                <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-bold bg-background/50 text-foreground border-border/50">
                  {totalItemsCount}
                </Badge>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 px-2 text-[11px] font-bold transition-all",
                  isAllSelected 
                    ? "text-destructive hover:text-destructive hover:bg-destructive/5" 
                    : "text-[#1B5E20] hover:text-[#2E7D32] hover:bg-[#1B5E20]/5"
                )}
                onClick={handleToggleAll}
              >
                {isAllSelected ? "Deselect All" : "Select All"}
              </Button>
            </div>

            {/* Fees Section */}
            {hasFees && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <Checkbox
                    checked={isAllFeesChecked}
                    onCheckedChange={handleSelectAllFees}
                  />
                  <CreditCard className="size-4 text-[#1B5E20]" />
                  <h3 className="text-sm font-medium text-foreground">Fees</h3>
                  <Badge variant="secondary" className="text-[10px] ml-auto">
                    {groupedItems.fees.length} items
                  </Badge>
                </div>
                <div className="flex flex-col gap-1.5">
                  {groupedItems.fees.map(renderItem)}
                </div>
              </div>
            )}

            {/* Fines Section */}
            {hasFines && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <Checkbox
                    checked={isAllFinesChecked}
                    onCheckedChange={handleSelectAllFines}
                  />
                  <AlertCircle className="size-4 text-destructive" />
                  <h3 className="text-sm font-medium text-foreground">Fines</h3>
                  <Badge variant="secondary" className="text-[10px] ml-auto">
                    {groupedItems.fines.length} items
                  </Badge>
                </div>
                <div className="flex flex-col gap-1.5">
                  {groupedItems.fines.map(renderItem)}
                </div>
              </div>
            )}

            {/* Other Items Section */}
            {hasOther && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <h3 className="text-sm font-medium text-foreground">Other Requirements</h3>
                  <Badge variant="secondary" className="text-[10px] ml-auto">
                    {groupedItems.other.length} items
                  </Badge>
                </div>
                <div className="flex flex-col gap-1.5">
                  {groupedItems.other.map(renderItem)}
                </div>
              </div>
            )}

            {/* Selection Summary */}
            {selection.selectedItems.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
                    <span className="text-sm font-medium text-muted-foreground">
                      Selected ({selection.selectedItems.length} item{selection.selectedItems.length !== 1 ? "s" : ""})
                    </span>
                    <span className="text-base font-bold text-foreground">₱{selection.total.toLocaleString()}</span>
                  </div>
                  
                  {/* Group-wise totals */}
                  {(groupTotals.feesTotal > 0 || groupTotals.finesTotal > 0 || groupTotals.otherTotal > 0) && (
                    <div className="text-xs text-muted-foreground px-4 space-y-1">
                      {groupTotals.feesTotal > 0 && (
                        <div className="flex justify-between">
                          <span className="flex items-center gap-1">
                            <CreditCard className="size-3 text-[#1B5E20]" /> Fees
                          </span>
                          <span className="font-mono">₱{groupTotals.feesTotal.toLocaleString()}</span>
                        </div>
                      )}
                      {groupTotals.finesTotal > 0 && (
                        <div className="flex justify-between">
                          <span className="flex items-center gap-1">
                            <AlertCircle className="size-3 text-destructive" /> Fines
                          </span>
                          <span className="font-mono">₱{groupTotals.finesTotal.toLocaleString()}</span>
                        </div>
                      )}
                      {groupTotals.otherTotal > 0 && (
                        <div className="flex justify-between">
                          <span>Other</span>
                          <span className="font-mono">₱{groupTotals.otherTotal.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        <DialogFooter>
          <LoadingButton variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancel
          </LoadingButton>
          <LoadingButton
            variant="success"
            disabled={selection.selectedRefIds.size === 0}
            className="gap-1.5"
            onClick={onLogPayment}
            isLoading={isProcessing}
            loadingText="Logging Payment..."
          >
            <PenLine className="size-3.5" />
            Log Payment
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}