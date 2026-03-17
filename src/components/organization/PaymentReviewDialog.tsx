"use client"

import { useState, useEffect } from "react"
import { Check, X, FileImage, Calendar, Hash, CreditCard, XCircle, CheckCircle } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaymentReviewLineItem {
  /** Display label for the item */
  label: string
  /** Optional sub-label shown below in muted text (e.g. "fine", "fee") */
  sublabel?: string
  amount?: number
  /**
   * Group key — when two or more items have different group values, section
   * headers are rendered above each group (e.g. "Fees" / "Fines").
   */
  group?: string
}

export interface PaymentReviewData {
  // ── Identity (optional — omit to hide the student/type section) ──────────
  studentName?: string
  studentId?: string
  /** e.g. "Membership Fee", "Bulk Payment" */
  typeLabel?: string

  // ── Covered items ─────────────────────────────────────────────────────────
  lineItems?: PaymentReviewLineItem[]
  /** When true, renders a "Total" row at the bottom of the items table */
  showLineItemsTotal?: boolean

  // ── Payment proof ─────────────────────────────────────────────────────────
  amountPaid: number
  /** If omitted the Payment Method row is hidden */
  paymentMethod?: string
  referenceNo?: string
  submittedAt: string
  /** Text shown inside the receipt placeholder box */
  receiptContent?: string

  // ── Read-only post-review info (shown when payment was already reviewed) ──
  declineRemarks?: string
  reviewedBy?: string
  reviewedAt?: string

  /** Overrides the default message shown in the approve confirmation dialog */
  approveConfirmMessage?: string
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface PaymentReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  data: PaymentReviewData | null
  /**
   * Provide both callbacks to enable Approve + Reject actions.
   * Omit both to render a read-only dialog with a Close button.
   */
  onApprove?: () => Promise<void>
  onReject?: (reason: string) => Promise<void>
  isProcessing?: boolean
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PaymentReviewDialog({
  open,
  onOpenChange,
  title = "Review Payment Submission",
  description = "Review the payment details and approve or reject the submission.",
  data,
  onApprove,
  onReject,
  isProcessing = false,
}: PaymentReviewDialogProps) {
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
 
  const isPending = Boolean(onApprove && onReject)

  async function handleApproveConfirmed() {
    setIsSubmitting(true)
    await onApprove?.()
    setApproveConfirmOpen(false)
    onOpenChange(false)
    setIsSubmitting(false)
  }

  async function handleRejectConfirmed() {
    if (!rejectReason.trim()) return
    setIsSubmitting(true)
    onReject?.(rejectReason)
    setRejectOpen(false)
    setRejectReason("")
    onOpenChange(false)
    setIsSubmitting(false)
  }

  function renderLineItems() {
    if (!data?.lineItems?.length) return null
    const items = data.lineItems

    // Determine whether to render group headers
    const groupValues = items.map(i => i.group).filter((g): g is string => Boolean(g))
    const uniqueGroups = [...new Set(groupValues)]
    const hasGroups = uniqueGroups.length > 1

    const total = items.reduce((s, i) => s + (i.amount ?? 0), 0)

    const renderRow = (item: PaymentReviewLineItem) => (
      <div key={item.label} className="flex items-center justify-between px-3 py-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm">{item.label}</span>
          {item.sublabel && (
            <span className="text-xs capitalize text-muted-foreground">{item.sublabel}</span>
          )}
        </div>
        {item.amount != null && (
          <span className="text-sm font-medium">₱{item.amount.toLocaleString()}</span>
        )}
      </div>
    )

    return (
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Payable Covered
        </p>
        <div className="divide-y divide-border rounded-md border border-border">
          {hasGroups
            ? uniqueGroups.map(group => (
                <div key={group}>
                  <div className="border-b border-border bg-muted/40 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                    {group}
                  </div>
                  {items.filter(i => i.group === group).map(renderRow)}
                </div>
              ))
            : items.map(renderRow)}
          {data.showLineItemsTotal && (
            <div className="flex items-center justify-between bg-muted/40 px-3 py-2">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-sm font-semibold">₱{total.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      {/* ── Main review dialog ─────────────────────────────────────────── */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          {data && (
            <div className="flex flex-col gap-4">
              {/* Optional identity section */}
              {(data.studentName || data.typeLabel) && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {data.studentName && (
                      <div>
                        <Label className="text-muted-foreground">Student</Label>
                        <p className="mt-0.5 text-sm font-medium">{data.studentName}</p>
                        {data.studentId && (
                          <p className="text-xs text-muted-foreground">{data.studentId}</p>
                        )}
                      </div>
                    )}
                    {data.typeLabel && (
                      <div>
                        <Label className="text-muted-foreground">Type</Label>
                        <p className="mt-0.5 text-sm font-medium">{data.typeLabel.toUpperCase()}</p>
                      </div>
                    )}
                  </div>
                  <Separator />
                </>
              )}

              {/* Covered line items */}
              {renderLineItems()}

              {/* Receipt placeholder */}
             {data.paymentMethod !== "cash" && data.receiptContent && (
                <div className="group relative h-48 w-full rounded-md border bg-muted/30">
                  <img
                    src={data.receiptContent}
                    alt="Receipt"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  
                  {/* Overlay on Hover */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <a 
                      href={data.receiptContent} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-xs font-medium text-white underline"
                    >
                      View Full Receipt
                    </a>
                  </div>
                </div>
              )}

              <Separator />

              {/* Payment details grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {data.paymentMethod && (
                  <div>
                    <Label className="text-muted-foreground">Payment Method</Label>
                    <p className="mt-0.5 text-sm font-medium">{data.paymentMethod.toUpperCase()}</p>
                  </div>
                )}
                {data.referenceNo && (
                  <div>
                    <Label className="text-muted-foreground">Reference No.</Label>
                    <p className="mt-0.5 text-sm font-mono">{data.referenceNo}</p>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground">Amount Paid</Label>
                  <p className="mt-0.5 text-sm font-medium">₱{data.amountPaid.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date Submitted</Label>
                  <p className="mt-0.5 text-sm">{data.submittedAt}</p>
                </div>
              </div>

              {/* Decline remarks (read-only, shown for declined payments) */}
              {data.declineRemarks && (
                <div>
                  <Label className="text-muted-foreground">Decline Remarks</Label>
                  <p className="mt-1 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {data.declineRemarks}
                  </p>
                </div>
              )}

              {/* Reviewed-by info */}
              {(data.reviewedBy || data.reviewedAt) && (
                <p className="text-xs text-muted-foreground">
                  Reviewed{data.reviewedAt ? ` on ${data.reviewedAt}` : ""}
                  {data.reviewedBy ? ` by ${data.reviewedBy}` : ""}
                </p>
              )}

              <DialogFooter className="flex-col gap-2 sm:flex-row">
                {isPending ? (
                  <>
                    <Button
                      variant="outline"
                      className="gap-1.5 text-destructive hover:text-destructive"
                      onClick={() => setRejectOpen(true)}
                      disabled={isProcessing}
                    >
                      <XCircle className="size-4" /> Reject
                    </Button>
                    <Button 
                      className="gap-1.5" 
                      onClick={() => setApproveConfirmOpen(true)}
                      disabled={isProcessing}
                    >
                      <CheckCircle className="size-4" /> Approve
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Close
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Approve confirmation ───────────────────────────────────────── */}
      <Dialog open={approveConfirmOpen} onOpenChange={setApproveConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Approval</DialogTitle>
            <DialogDescription>
              {data?.approveConfirmMessage ?? "Are you sure you want to approve this payment?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveConfirmOpen(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={handleApproveConfirmed} disabled={isSubmitting} className="gap-2">
              {isSubmitting && <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
              Yes, Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reject with reason ────────────────────────────────────────── */}
      <Dialog
        open={rejectOpen}
        onOpenChange={v => { setRejectOpen(v); if (!v) setRejectReason("") }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this payment submission.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="prd-rejectReason">Reason for Rejection</Label>
            <Textarea
              id="prd-rejectReason"
              placeholder="e.g. Receipt image is unclear. Please resubmit."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setRejectOpen(false); setRejectReason("") }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectReason.trim() || isSubmitting}
              onClick={handleRejectConfirmed}
              className="gap-2"
            >
              {isSubmitting && <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
