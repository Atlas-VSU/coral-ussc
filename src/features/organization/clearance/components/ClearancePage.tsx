"use client"

import { useState, useRef, useMemo } from "react"
import { Eye, PenLine, Check, Clock, X } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// UI Components
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/organization/PageHeader"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { DataPagination } from "@/components/organization/DataPagination"
import { PaymentReviewDialog } from "@/components/organization/PaymentReviewDialog"
import PaymentReceiptDialog from "@/components/organization/PaymentReceiptDialog"

// Local Components & Hooks
import { ClearanceStats } from "./ClearanceStats"
import { ClearanceFilters } from "./ClearanceFilters"
import { RequirementsBreakdown } from "./RequirementsBreakdown"
import { useClearances } from "../hooks/useClearances"
import { useClearanceActions } from "../hooks/useClearanceAction"
import { useManualPaymentSelection } from "../hooks/useManualPaymentSelection"
import { buildRequirementGroups } from "../utils/clearanceUtils"

// Types
import type { ViewMode } from "@/components/organization/ViewToggle"
import type { ClearanceStatus } from "../types"
import type { ReceiptData } from "@/components/organization/PaymentReceiptDialog"
import { PaymentType } from "@/constants/types"

interface ClearancePageProps {
  orgId: string | undefined
}

export default function ClearancePage({ orgId }: ClearancePageProps) {
  const { clearances, loading, setClearances } = useClearances(orgId)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [viewMode, setViewMode] = useState<ViewMode>("table")
  const [currentPage, setCurrentPage] = useState(1)

  const [paymentReviewOpen, setPaymentReviewOpen] = useState(false)
  const [reviewTarget, setReviewTarget] = useState<{ clearanceId: string; referenceId: string } | null>(null)

  const [logPaymentOpen, setLogPaymentOpen] = useState(false)
  const [logPaymentTarget, setLogPaymentTarget] = useState<ClearanceStatus | null>(null)

  const [receiptOpen, setReceiptOpen] = useState(false)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)

  const [isProcessing, setIsProcessing] = useState(false)

  const idCounter = useRef(0)

  const { approvePayment, rejectPayment, logManualPayment } = useClearanceActions(clearances, setClearances)
  const selection = useManualPaymentSelection(logPaymentTarget)

  const filtered = useMemo(() => {
    return clearances.filter(c => {
      const matchesSearch = c.userName.toLowerCase().includes(search.toLowerCase()) || 
                            c.studentId.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = filterStatus === "all" || c.status === filterStatus
      return matchesSearch && matchesStatus
    })
  }, [clearances, search, filterStatus])

  const totalPages = Math.ceil(filtered.length / 10)
  const paginated = filtered.slice((currentPage - 1) * 10, currentPage * 10)

  const openPaymentReview = (clearanceId: string, referenceId: string) => {
    setReviewTarget({ clearanceId, referenceId })
    setPaymentReviewOpen(true)
  }

  const handleApprovePayment = async () => {
    if (!reviewTarget) return
    setIsProcessing(true)
    try {
      await approvePayment(reviewTarget.clearanceId, [reviewTarget.referenceId])
      setReviewTarget(null)
      setPaymentReviewOpen(false)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRejectPayment = async (reason: string) => {
    if (!reviewTarget) return
    setIsProcessing(true)
    try {
      await rejectPayment(reviewTarget.clearanceId, [reviewTarget.referenceId], reason)
      setReviewTarget(null)
      setPaymentReviewOpen(false)
    } finally {
      setIsProcessing(false)
    }
  }

  const openLogPayment = (clearanceId: string) => {
    const clearance = clearances.find(c => c.id === clearanceId) ?? null
    setLogPaymentTarget(clearance)
    setLogPaymentOpen(true)
  }

  const handleLogPayment = async () => {
    if (!logPaymentTarget || selection.selectedRefIds.size === 0) return

    setIsProcessing(true)
    try {
      await logManualPayment(
        logPaymentTarget.id,
        Array.from(selection.selectedRefIds),
        selection.total,
        new Date().toISOString().slice(0, 10)
      )

      idCounter.current += 1
      setReceiptData({
        receiptId: `CLR-${idCounter.current}`,
        studentName: logPaymentTarget.userName,
        studentId: logPaymentTarget.studentId,
        items: selection.selectedItems.map(i => ({
          name: i.label,
          type: i.type === PaymentType.FEES ? "fees" : "fines",
          amount: i.amount,
        })),
        total: selection.total,
        date: new Date().toISOString().slice(0, 10),
      })

      setLogPaymentOpen(false)
      setReceiptOpen(true)
      toast.success(`Payment logged for ${logPaymentTarget.userName}`)
      setLogPaymentTarget(null)
      selection.clearSelection()
    } finally {
      setIsProcessing(false)
    }
  }

  const reviewData = useMemo(() => {
    if (!reviewTarget) return null
    const clearance = clearances.find(c => c.id === reviewTarget.clearanceId)
    if (!clearance) return null
    const item = clearance.blockingItems[reviewTarget.referenceId]
    if (!item) return null
    
    return {
      lineItems: [{ label: item.title, amount: item.balance }],
      amountPaid: item.balance,
      paymentMethod: item.paymentHistory[0]?.paymentMethod || "cash",
      referenceNo: item.paymentHistory[0]?.gcashReference || "",
      submittedAt: item.paymentHistory[0]?.createdAt.toDate().toISOString(),
      approveConfirmMessage: "This item will be marked as cleared.",
    }
  }, [reviewTarget, clearances])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Clearance Management"
        context="2nd Semester · A.Y. 2025–2026"
        description="Review and manage student clearance statuses"
      />

      <ClearanceStats clearances={clearances} />

      {loading && clearances.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="size-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            <p className="text-sm text-muted-foreground italic">Fetching clearance records...</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border bg-card">
          <CardHeader>
          <ClearanceFilters
            search={search}
            onSearchChange={(v) => { setSearch(v); setCurrentPage(1) }}
            filterStatus={filterStatus}
            onFilterChange={(v) => { setFilterStatus(v); setCurrentPage(1) }}
            onExport={() => toast.success("Export started (mock)")}
            viewMode={viewMode}
            onViewChange={setViewMode}
          />
        </CardHeader>
        <CardContent>
          {viewMode === "card" ? (
            paginated.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No clearance records found.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {paginated.map(c => (
                  <Card key={c.id} className="border-border bg-card">
                    <CardContent className="flex flex-col gap-3 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{c.userName}</p>
                          <p className="text-xs text-muted-foreground">{c.studentId}</p>
                        </div>
                        <Badge variant={c.status === "cleared" ? "secondary" : c.status === "not_cleared" ? "destructive" : "outline"} className="capitalize shrink-0">
                          {c.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="flex flex-col gap-2">
                        {buildRequirementGroups(c.blockingItems).map(g => {
                          const Icon = g.status === "cleared" ? Check : g.status === "pending" ? Clock : X
                          return (
                            <div key={g.name} className={cn(
                              "flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs",
                              g.status === "cleared" && "bg-success/10",
                              g.status === "pending" && "bg-warning/10",
                              g.status === "not-cleared" && "bg-destructive/10",
                            )}>
                              <span className={cn(
                                "font-medium",
                                g.status === "cleared" && "text-success",
                                g.status === "pending" && "text-warning-foreground",
                                g.status === "not-cleared" && "text-destructive",
                              )}>{g.name}</span>
                              <Icon className={cn(
                                "size-3.5",
                                g.status === "cleared" && "text-success",
                                g.status === "pending" && "text-warning-foreground",
                                g.status === "not-cleared" && "text-destructive",
                              )} />
                            </div>
                          )
                        })}
                      </div>
                      <div className="mt-auto pt-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs"><Eye className="size-3.5" /> View Details</Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle className="text-foreground">Clearance — {c.userName}</DialogTitle>
                              <DialogDescription className="text-muted-foreground">{c.studentId}</DialogDescription>
                            </DialogHeader>
                            <RequirementsBreakdown
                              clearance={c}
                              onReviewPayment={openPaymentReview}
                              onLogPayment={openLogPayment}
                            />
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border">
                    <TableHead>Student</TableHead>
                    <TableHead>Requirements</TableHead>
                    <TableHead>Overall Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map(c => (
                    <TableRow key={c.id} className="border-border">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">{c.userName}</span>
                          <span className="text-xs text-muted-foreground">{c.studentId}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1.5">
                          {buildRequirementGroups(c.blockingItems).map(g => (
                            <span
                              key={g.name}
                              className={cn(
                                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                                g.status === "cleared" && "bg-success/10 text-success",
                                g.status === "pending" && "bg-warning/10 text-warning-foreground",
                                g.status === "not-cleared" && "bg-destructive/10 text-destructive",
                              )}
                            >
                              {g.name}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={c.status === "cleared" ? "secondary" : c.status === "not_cleared" ? "destructive" : "outline"} className="capitalize">
                          {c.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1.5 text-xs"><Eye className="size-3.5" /> View Details</Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle className="text-foreground">Clearance — {c.userName}</DialogTitle>
                              <DialogDescription className="text-muted-foreground">{c.studentId}</DialogDescription>
                            </DialogHeader>
                            <RequirementsBreakdown
                              clearance={c}
                              onReviewPayment={openPaymentReview}
                              onLogPayment={openLogPayment}
                            />
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paginated.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No clearance records found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          <DataPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            itemsPerPage={10}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>
      )}

      <PaymentReviewDialog
        open={paymentReviewOpen}
        onOpenChange={setPaymentReviewOpen}
        data={reviewData}
        onApprove={handleApprovePayment}
        onReject={handleRejectPayment}
        isProcessing={isProcessing}
      />

      <Dialog open={logPaymentOpen} onOpenChange={setLogPaymentOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Payment Manually — {logPaymentTarget?.userName}</DialogTitle>
            <DialogDescription>{logPaymentTarget?.studentId}</DialogDescription>
          </DialogHeader>

          {logPaymentTarget && selection.items.length > 0 && (
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
                  {selection.items.map(item => (
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
            <Button variant="outline" onClick={() => setLogPaymentOpen(false)} disabled={isProcessing}>Cancel</Button>
            <Button
              disabled={selection.selectedRefIds.size === 0 || isProcessing}
              className="gap-1.5 border-[#1B5E20]/40 bg-[#1B5E20] text-white hover:bg-[#2E7D32] dark:bg-green-700 dark:hover:bg-green-600"
              onClick={handleLogPayment}
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

      <PaymentReceiptDialog
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        data={receiptData}
      />
    </div>
  )
}