"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { getCurrentUserData } from "@/firebase"
import Image from "next/image"

export interface ReceiptItem {
  name: string
  type: "fees" | "fines"
  amount: number
}

export interface ReceiptData {
  receiptId: string
  studentName: string
  studentId: string
  items: ReceiptItem[]
  total: number
  date: string
  verifiedByName: string
  paymentMethod: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: ReceiptData | null
}

export default function PaymentReceiptDialog({ open, onOpenChange, data }: Props) {
  function handlePrint() {
    if (!data) return

    const itemRows = data.items
      .map(
        i =>
          `<div class="row"><span class="item-name">${i.name}</span><span>₱${i.amount.toLocaleString()}</span></div>`,
      )
      .join("")

    // Grab the current domain so the image loads properly in the popup
    const baseUrl = window.location.origin;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${data.receiptId}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: sans-serif; display: flex; justify-content: center; padding: 32px; background: white; }
            .receipt { border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; width: 340px; font-size: 14px; color: #000; }
            .header { text-align: center; margin-bottom: 16px; }
            .header img { width: 40px; height: 40px; margin: 0 auto 8px; display: block; }
            .org-name { font-weight: 700; font-size: 16px; }
            .university { font-size: 11px; margin-top: 2px; }
            .subtitle { font-size: 11px; color: #6b7280; margin-top: 2px; }
            hr { border: none; border-top: 1px solid #e5e7eb; margin: 12px 0; }
            .row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px; gap: 8px; }
            .item-name { flex: 1; }
            .value { font-weight: 500; }
            .section-label { font-size: 11px; color: #6b7280; margin-bottom: 4px; }
            .student-name { font-weight: 500; font-size: 14px; }
            .student-id { font-size: 11px; margin-top: 2px; }
            .total-row { display: flex; justify-content: space-between; font-weight: 600; font-size: 16px; }
            .footer { text-align: center; font-size: 11px; }
            .footer p + p { margin-top: 4px; }
            .footer-note { margin-top: 24px; text-align: center; font-size: 11px; color: #6b7280; }
          
            /* --- NEW PRINT SPECIFIC STYLES --- */
            @page {
              margin: 0; /* Removes browser default margins, dates, and URLs */
            }
            
            @media print {
              body {
                padding: 0; /* Removes the 32px padding you set for the preview */
                display: block; /* Changes from flex to block so it aligns to top-left */
              }
              .receipt {
                border: none; /* Optional: Removes the border since the paper edge acts as the border */
                margin: 0 auto; /* Centers the receipt on the paper */
                width: 100%; /* Uncomment this if you want it to stretch to the absolute edges of a thermal printer */
              }
            }
          </style>


        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <img src="${baseUrl}/images/ussc-logo-1.webp" alt="Org Logo" />
              <p class="org-name">University Supreme Student Council</p>
              <p class="university">Visayas State University Main Campus</p>
              <p class="subtitle">Official Payment Receipt</p>
            </div>

            <hr />
            <div class="row"><span>Receipt No.</span><span class="value">${data.receiptId}</span></div>
            <div class="row"><span>Date</span><span>${data.date}</span></div>
            <div class="row"><span>Term</span><span>2nd Semester, A.Y. 2025-2026</span></div>

            <hr />
            <p class="section-label">Received From</p>
            <p class="student-name">${data.studentName}</p>
            <p class="student-id">${data.studentId}</p>

            <hr />
            <p class="section-label">Items Paid</p>
            ${itemRows}

            <hr />
            <div class="total-row"><span>Total Paid</span><span>₱${data.total.toLocaleString()}</span></div>

            <hr />
            <div class="footer">
              <p>Payment Method: ${data.paymentMethod.toLocaleUpperCase()}</p>
              <p>Verified by ${data.verifiedByName}</p>
            </div>
            <p class="footer-note">This serves as an official proof of payment.</p>
          </div>

          <script>
            // Wait for the window (and the image) to fully load before printing
            window.onload = function() {
              window.focus();
              window.print();
              
              // Optional: Uncomment the next line if you want the popup window 
              // to close automatically after the user finishes printing
              // window.close();
            };
          </script>
        </body>
      </html>
    `

    const newWindow = window.open("", "", "width=620,height=800")
    if (newWindow) {
      newWindow.document.write(html)
      newWindow.document.close()
    }
  }

  if (!data) return null
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Payment Receipts</DialogTitle>
          <DialogDescription>Preview before printing</DialogDescription>
        </DialogHeader>

        <div className="border rounded-lg p-6 bg-white text-black text-sm max-w-sm mx-auto">
          {/* Header */}
          <div className="text-center mb-4">
            <Image
              src="/images/ussc-logo-1.webp"
              alt="Org Logo"
              width={40}
              height={40}
              className="mx-auto mb-2"
            />
            <p className="font-bold text-lg">University Supreme Student Council</p>
            <p className="text-xs">Visayas State University - Baybay Main Campus</p>
            <p className="text-xs text-muted-foreground">Official Payment Receipt</p>
          </div>

          <Separator className="my-3" />

          {/* Receipt info */}
          <div className="flex justify-between text-xs">
            <span>Receipt No.</span>
            <span className="font-medium">{data.receiptId}</span>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span>Date</span>
            <span>{data.date}</span>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span>Term</span>
            <span>2nd Semester, A.Y. 2025-2026</span>
          </div>


          <Separator className="my-3" />

          {/* Student info */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Received From</p>
            <p className="font-medium">{data.studentName}</p>
            <p className="text-xs">{data.studentId}</p>
          </div>

          <Separator className="my-3" />

          {/* Items */}
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground mb-1">Items Paid</p>
            {data.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-xs gap-2">
                <span className="flex-1 leading-snug">
                  {item.name}
                  <span className="text-muted-foreground"> ({item.type})</span>
                </span>
                <span className="shrink-0 font-medium">₱{item.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>

          <Separator className="my-3" />

          {/* Total */}
          <div className="flex justify-between font-semibold text-base">
            <span>Total Paid</span>
            <span>₱{data.total.toLocaleString()}</span>
          </div>

          <Separator className="my-4" />

          {/* Footer */}
          <div className="text-center text-xs space-y-1">
            <p>Payment Method: {data.paymentMethod.toLocaleUpperCase()}</p>
            <p>Verified by {data.verifiedByName}</p>
          </div>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            This serves as an official proof of payment.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button 
          variant="default"
          onClick={handlePrint}>
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
