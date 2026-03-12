"use client"

import { useState, useEffect } from "react"
import { Check, X, FileImage, Calendar, Hash, CreditCard } from "lucide-react"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

export interface ReviewData {
  lineItems: { label: string; amount: number }[]
  amountPaid: number
  paymentMethod: string
  referenceNo?: string | null
  submittedAt?: string
  receiptImageUrl?: string | null
  approveConfirmMessage?: string
}

interface PaymentReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: ReviewData | null
  onApprove: () => void
  onReject: (reason: string) => void
}

export function PaymentReviewDialog({
  open,
  onOpenChange,
  data,
  onApprove,
  onReject,
}: PaymentReviewDialogProps) {
  const [isRejecting, setIsRejecting] = useState(false)
  const [rejectReason, setRejectReason] = useState("")

  // Reset internal state when dialog closes/opens
  useEffect(() => {
    if (open) {
      setIsRejecting(false)
      setRejectReason("")
    }
  }, [open])

  if (!data) return null

  const handleRejectConfirm = () => {
    if (!rejectReason.trim()) return
    onReject(rejectReason)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Payment Submission</DialogTitle>
          <DialogDescription>
            Verify the payment details and receipt below before approving.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Left Column: Payment Details */}
          <div className="flex flex-col gap-4">
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Payment For</Label>
              <div className="mt-2 flex flex-col gap-2">
                {data.lineItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm border-b pb-2 last:border-0 last:pb-0">
                    <span className="font-medium text-foreground">{item.label}</span>
                    <span className="text-muted-foreground">₱{item.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm flex items-center gap-2 text-muted-foreground">
                  <CreditCard className="size-4" /> Method
                </span>
                <Badge variant="outline" className="uppercase">{data.paymentMethod.replace("_", " ")}</Badge>
              </div>

              {data.referenceNo && (
                <div className="flex justify-between items-center">
                  <span className="text-sm flex items-center gap-2 text-muted-foreground">
                    <Hash className="size-4" /> Reference No.
                  </span>
                  <span className="font-mono text-sm">{data.referenceNo}</span>
                </div>
              )}

              {data.submittedAt && (
                <div className="flex justify-between items-center">
                  <span className="text-sm flex items-center gap-2 text-muted-foreground">
                    <Calendar className="size-4" /> Submitted
                  </span>
                  <span className="text-sm">{format(new Date(data.submittedAt), "MMM dd, yyyy p")}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <span className="font-semibold text-foreground">Total Paid</span>
                <span className="text-lg font-bold text-primary">₱{data.amountPaid.toLocaleString()}</span>
              </div>
            </div>

            {isRejecting && (
              <div className="mt-2 space-y-2 animate-in fade-in slide-in-from-top-2">
                <Label htmlFor="reason" className="text-destructive">Reason for Rejection *</Label>
                <Textarea
                  id="reason"
                  placeholder="E.g., Receipt image is blurry, reference number does not match..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="resize-none border-destructive/50 focus-visible:ring-destructive"
                />
              </div>
            )}
          </div>

          {/* Right Column: Receipt Image */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Proof of Payment</Label>
            <div className="flex-1 min-h-[250px] rounded-lg border border-border bg-muted/30 flex items-center justify-center overflow-hidden relative">
              {data.receiptImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={data.receiptImageUrl} 
                  alt="Payment Receipt" 
                  className="object-contain w-full h-full"
                />
              ) : (
                <div className="flex flex-col items-center text-muted-foreground">
                  <FileImage className="size-8 mb-2 opacity-50" />
                  <span className="text-sm">No receipt provided</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {!isRejecting ? (
            <>
              <Button variant="outline" onClick={() => setIsRejecting(true)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                <X className="size-4 mr-1.5" /> Reject Payment
              </Button>
              <Button onClick={onApprove} className="bg-success text-success-foreground hover:bg-success/90">
                <Check className="size-4 mr-1.5" /> Approve & Clear
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setIsRejecting(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleRejectConfirm} disabled={!rejectReason.trim()}>
                Confirm Rejection
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}