"use client"

import { useState } from "react"
import { CheckCircle, XCircle } from "lucide-react"
import { Button } from "../ui/button"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { Separator } from "../ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"

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
  onApprove?: () => void
  onReject?: (reason: string) => void
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
}: PaymentReviewDialogProps) {
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")

  const isPending = Boolean(onApprove && onReject)

  function handleApproveConfirmed() {
    onApprove?.()
    setApproveConfirmOpen(false)
    onOpenChange(false)
  }

  function handleRejectConfirmed() {
    if (!rejectReason.trim()) return
    onReject?.(rejectReason)
    setRejectOpen(false)
    setRejectReason("")
    onOpenChange(false)
  }

  function renderLineItems() {
    if (!data?.lineItems?.length) return null
    const items = data.lineItems

    // Determine whether to render group headers
    const groupValues = items.map(i => i.group).filter((g): g is string => Boolean(g))
    const uniqueGroups = [...new Set(groupValues)]
    const hasGroups = uniqueGroups.length > 1

    const total = items.reduce((s, i) => s + (i.amount ?? 0), 0)

    const renderRow = (item: PaymentReviewLineItem, index: number) => (
      <div key={item.label + "-" + index} className="flex items-center justify-between px-3 py-2">
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
                        <p className="mt-0.5 text-sm font-medium">{data.typeLabel}</p>
                      </div>
                    )}
                  </div>
                  <Separator />
                </>
              )}

              {/* Covered line items */}
              {renderLineItems()}

              {/* Receipt placeholder */}
              <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-border bg-muted/30 text-sm text-muted-foreground">
                {data.receiptContent ?? "Receipt Image Preview"}
              </div>

              <Separator />

              {/* Payment details grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {data.paymentMethod && (
                  <div>
                    <Label className="text-muted-foreground">Payment Method</Label>
                    <p className="mt-0.5 text-sm font-medium">{data.paymentMethod}</p>
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
                    >
                      <XCircle className="size-4" /> Reject
                    </Button>
                    <Button className="gap-1.5" onClick={() => setApproveConfirmOpen(true)}>
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
            <Button variant="outline" onClick={() => setApproveConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApproveConfirmed}>Yes, Approve</Button>
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
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectReason.trim()}
              onClick={handleRejectConfirmed}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
