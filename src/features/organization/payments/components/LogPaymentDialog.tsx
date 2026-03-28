import { PenLine } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Member, Program } from "../../members/types"
import { BlockingItem, ClearanceStatus } from "../../clearance/types"

interface LogPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: ClearanceStatus | null
  checkedDues: Set<string>
  selectedDues: BlockingItem[]
  selectedTotal: number
  paymentDate: string
  onPaymentDateChange: (date: string) => void
  onToggleDue: (id: string) => void
  onToggleAll: () => void
  onLogPayment: () => void
  student: Member | null
  studentProgram: Program | null
  isLoading: boolean
  isSubmitting: boolean
}

const DUE_TYPES = ["fees", "fines"] as const

export function LogPaymentDialog({
  open, onOpenChange, record,
  checkedDues, selectedDues, selectedTotal,
  paymentDate, onPaymentDateChange,
  onToggleDue, onToggleAll, onLogPayment, student,studentProgram, isLoading, isSubmitting 
}: LogPaymentDialogProps) {

  const handleToggleType = (type: string) => {
    if (!record) return
    const duesOfType: BlockingItem[] = []
    for (const [key, dues] of Object.entries(record.blockingItems)) { 
      if (dues.type === type) {
        duesOfType.push(dues)
       }
    }
    const allChecked = duesOfType.every(d => checkedDues.has(d.referenceId))
    duesOfType.forEach(d => {
      const isChecked = checkedDues.has(d.referenceId)
      if (allChecked && isChecked) onToggleDue(d.referenceId)
      if (!allChecked && !isChecked) onToggleDue(d.referenceId)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Unsettled Dues — {record?.userName}</DialogTitle>
          <DialogDescription>
            {record?.studentId} · {studentProgram?.shortName} · Year {student?.yearLevel}
          </DialogDescription>
        </DialogHeader>

        {record && (
          <div className="flex flex-col gap-4">

            {/* ── Student info ── */}
            <div className="rounded-md border border-border bg-muted/30 px-4 py-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  ["Student Name", record.userName],
                  ["Student ID",   record.studentId],
                  ["Program",      studentProgram?.shortName || "N/A"],
                  ["Year Level",   String(student!.yearLevel)], 
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
              <p className="text-xs font-bold uppercase tracking-wider text-foreground">Payable Items</p>

              <div className="flex flex-col gap-3">
                {DUE_TYPES.map(type => {
                  const duesOfType: BlockingItem[] = []
                  for (const [key, dues] of Object.entries(record.blockingItems)) { 
                    if (dues.type === type && dues.status === "unpaid") {
                      duesOfType.push(dues)
                    }
                  }
                  if (duesOfType.length === 0) return null

                  const allChecked = duesOfType.every(d => checkedDues.has(d.referenceId))
                  const someChecked = duesOfType.some(d => checkedDues.has(d.referenceId))
                  const totalBalance = duesOfType.reduce((sum, d) => sum + d.balance, 0)

                  return (
                    <div
                      key={type}
                      className={`flex flex-col gap-0 rounded-lg border transition-colors ${
                        allChecked
                          ? "border-primary/40 bg-primary/5"
                          : someChecked
                          ? "border-primary/20 bg-primary/[0.02]"
                          : "border-border"
                      }`}
                    >
                      <label className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors rounded-lg">
                        <Checkbox
                          checked={allChecked}
                          data-state={allChecked ? "checked" : someChecked ? "indeterminate" : "unchecked"}
                          onCheckedChange={() => handleToggleType(type)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground capitalize">{type}</p>
                          <p className="text-xs text-muted-foreground">
                            {duesOfType.length} item{duesOfType.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-foreground shrink-0">
                          ₱{totalBalance.toLocaleString()}
                        </span>
                      </label>

                      {/* Breakdown */}
                      <div className="flex flex-col gap-0 border-t border-border mx-4 mb-3">
                        {duesOfType.map((due, i) => (
                          <div
                            key={due.referenceId}
                            className={`flex items-center justify-between gap-2 py-2 text-xs ${
                              i !== duesOfType.length - 1 ? "border-b border-border/50" : ""
                            }`}
                          >
                            <p className="text-muted-foreground truncate">{due.title}</p>
                            <span className="text-muted-foreground shrink-0">
                              ₱{due.balance.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
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
            disabled={selectedDues.length === 0 || isLoading || isSubmitting}
            className="gap-1.5 bg-[#1B5E20] text-white hover:bg-[#2E7D32] dark:bg-green-700 dark:hover:bg-green-600"
            onClick={onLogPayment}
          >
            {isLoading || isSubmitting ? (
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