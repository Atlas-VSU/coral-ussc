import { PenLine } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import type { StudentUnpaidRecord } from "../types"
import { Program } from "../../members/types"

interface LogPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: StudentUnpaidRecord | null
  checkedDues: Set<string>
  selectedDues: StudentUnpaidRecord["dues"]
  selectedTotal: number
  paymentDate: string
  onPaymentDateChange: (date: string) => void
  onToggleDue: (id: string) => void
  onToggleAll: () => void
  onLogPayment: () => void
  studentProgram?: Program | null | undefined
  isLoading: boolean
}

export function LogPaymentDialog({
  open, onOpenChange, record,
  checkedDues, selectedDues, selectedTotal,
  paymentDate, onPaymentDateChange,
  onToggleDue, onToggleAll, onLogPayment,studentProgram, isLoading
}: LogPaymentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Unsettled Dues — {record?.student.firstName + " " + record?.student.lastName}</DialogTitle>
          <DialogDescription>
            {record?.student.studentId} · {studentProgram?.shortName} · Year {record?.student.yearLevel}
          </DialogDescription>
        </DialogHeader>

        {record && (
          <div className="flex flex-col gap-4">

            {/* ── Student info ── */}
            <div className="rounded-md border border-border bg-muted/30 px-4 py-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  ["Student Name", record.student.firstName + " " + record.student.lastName],
                  ["Student ID",   record.student.studentId],
                  ["Program",      studentProgram?.shortName || "N/A"],
                  ["Year Level",   String(record.student.yearLevel)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-muted-foreground">{label}</p>
                    <p className="text-sm font-medium text-foreground">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* ── Payable items ── */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-foreground">Payable Items</p>
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={onToggleAll}
                >
                  {record.dues.every(d => checkedDues.has(d.id)) ? "Deselect All" : "Select All"}
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                {record.dues.map(due => (
                  <label
                    key={due.id}
                    className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors has-[button[data-state=checked]]:border-primary/40 has-[button[data-state=checked]]:bg-primary/5"
                  >
                    <Checkbox
                      checked={checkedDues.has(due.id)}
                      onCheckedChange={() => onToggleDue(due.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground leading-snug">{due.name}</p>
                      <Badge variant="outline" className="mt-1 text-[10px] capitalize">{due.type}</Badge>
                    </div>
                    <span className="text-sm font-semibold text-foreground shrink-0">
                      ₱{due.item.balance.toLocaleString()}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* ── Selected total ── */}
            {selectedDues.length > 0 && (
              <>
                <Separator />
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    Selected ({selectedDues.length} item{selectedDues.length !== 1 ? "s" : ""})
                  </span>
                  <span className="text-base font-bold text-foreground">₱{selectedTotal.toLocaleString()}</span>
                </div>
              </>
            )}

            {/* ── Payment date ── */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="paymentDate">
                Date of Payment <span className="text-destructive">*</span>
              </Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentDate}
                onChange={e => onPaymentDateChange(e.target.value)}
              />
            </div>

          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={selectedDues.length === 0 || isLoading}
            className="gap-1.5 bg-[#1B5E20] text-white hover:bg-[#2E7D32] dark:bg-green-700 dark:hover:bg-green-600"
            onClick={onLogPayment}
          >
            <PenLine className="size-3.5" />
            Log Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
