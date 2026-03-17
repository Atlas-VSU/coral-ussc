"use client"

import { useState } from "react"
import { AlertTriangle, UserX, Users, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Separator } from "@/components/ui/separator"
import type { EventAttendance } from "@/features/organization/log-attendance/types"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventName: string
  attendance: EventAttendance[]
  onConfirm: () => void
}

export function GenerateFinesDialog({
  open,
  onOpenChange,
  eventName,
  attendance,
  onConfirm,
}: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  const absentCount  = attendance.filter(a => a.status === "absent").length
  const presentCount = attendance.filter(a => a.status === "present").length
  const partiallyAbsentCount = attendance.filter(a => a.status === "partially absent").length
  const totalCount   = attendance.length

  function handleConfirmed() {
    onConfirm()
    setConfirmOpen(false)
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-destructive" />
              Generate Fines
            </DialogTitle>
            <DialogDescription>
              Fines will be issued to all students who were not present during{" "}
              <span className="font-medium text-foreground">{eventName}</span>.
              Excused students will not be fined.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-border divide-y divide-border text-sm">
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Users className="size-3.5" /> Total records
              </span>
              <span className="font-medium">{totalCount}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="flex items-center gap-2 text-[#1B5E20] dark:text-[#8BC34A]">
                <CheckCircle className="size-3.5" /> Present
              </span>
              <span className="font-medium text-[#1B5E20] dark:text-[#8BC34A]">{presentCount}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                <UserX className="size-3.5" /> Partially Absent (no fine)
              </span>
              <span className="font-medium text-yellow-600 dark:text-yellow-400">{partiallyAbsentCount}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5 bg-destructive/5 rounded-b-lg">
              <span className="flex items-center gap-2 text-destructive font-medium">
                <UserX className="size-3.5" /> Will be fined
              </span>
              <span className="font-bold text-destructive">{absentCount}</span>
            </div>
          </div>

          {absentCount === 0 && (
            <p className="text-xs text-center text-muted-foreground">
              No absent students — there is nothing to generate.
            </p>
          )}

          <Separator />

          <p className="text-xs text-muted-foreground">
            To review specific students before confirming, close this dialog and filter the attendance list by{" "}
            <span className="font-medium text-foreground">Absent</span>.
          </p>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={absentCount === 0}
              onClick={() => setConfirmOpen(true)}
            >
              Generate {absentCount} Fine{absentCount !== 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will generate{" "}
              <span className="font-semibold text-foreground">{absentCount} fine{absentCount !== 1 ? "s" : ""}</span>{" "}
              for absent students in{" "}
              <span className="font-semibold text-foreground">{eventName}</span>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleConfirmed}
            >
              Yes, Generate Fines
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}