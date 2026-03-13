"use client"

import { CheckCircle2, Download, Printer } from "lucide-react"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

export interface ReceiptData {
  receiptId: string
  studentName: string
  studentId: string
  items: { name: string; type: string; amount: number }[]
  total: number
  date: string
}

interface PaymentReceiptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: ReceiptData | null
}

export default function PaymentReceiptDialog({
  open,
  onOpenChange,
  data,
}: PaymentReceiptDialogProps) {
  if (!data) return null

  const handlePrint = () => {
    // In a real app, you might use window.print() combined with a print stylesheet,
    // or generate a PDF using a library like jsPDF/html2canvas.
    window.print()
    toast.success("Sending to printer...")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-[425px]">
        <DialogHeader className="sr-only">
          <DialogTitle>Payment Receipt</DialogTitle>
        </DialogHeader>
        
        {/* Receipt Body */}
        <div className="flex flex-col items-center pt-6 pb-2" id="printable-receipt">
          <div className="size-12 rounded-full bg-success/10 flex items-center justify-center mb-4">
            <CheckCircle2 className="size-6 text-success" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Payment Successful</h2>
          <p className="text-sm text-muted-foreground mt-1">Receipt #{data.receiptId}</p>

          <div className="w-full mt-8 bg-muted/30 rounded-lg border border-border p-5">
            <div className="flex flex-col gap-1 mb-6 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span className="font-medium">{format(new Date(data.date), "MMM dd, yyyy")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Student:</span>
                <span className="font-medium text-right">{data.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID No:</span>
                <span className="font-medium">{data.studentId}</span>
              </div>
            </div>

            <Separator className="border-dashed mb-4" />

            <div className="flex flex-col gap-3 mb-6">
              {data.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-sm">
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{item.name}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">{item.type}</span>
                  </div>
                  <span className="font-medium mt-0.5">₱{item.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>

            <Separator className="border-dashed mb-4" />

            <div className="flex justify-between items-center">
              <span className="font-bold text-foreground">Amount Paid</span>
              <span className="text-xl font-black text-primary">₱{data.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 w-full mt-4">
          <Button variant="outline" className="w-full sm:w-1/2 gap-2" onClick={handlePrint}>
            <Printer className="size-4" /> Print
          </Button>
          <Button className="w-full sm:w-1/2 gap-2" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}