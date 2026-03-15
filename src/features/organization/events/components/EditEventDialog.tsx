"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { Event, EventStatus } from "../types"

interface EditEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: Event | null
  onEventEdited: () => void
}

export function EditEventDialog({ open, onOpenChange, event, onEventEdited }: EditEventDialogProps) {
  const [loading, setLoading] = useState(false)
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [name, setName] = useState("")
  const [location, setLocation] = useState("")
  const [note, setNote] = useState("")
  const [majorEvent, setMajorEvent] = useState(false)
  const [status, setStatus] = useState<EventStatus>("upcoming")
  const [timeInStart, setTimeInStart] = useState("")
  const [timeInEnd, setTimeInEnd] = useState("")
  const [timeOutStart, setTimeOutStart] = useState("")
  const [timeOutEnd, setTimeOutEnd] = useState("")

  // useEffect(() => {
  //   if (event) {
  //     //setName(event.name)
  //     setDate(new Date(event.date))
  //     setLocation(event.location)
  //     setNote(event.note || "")
  //     setMajorEvent(event.majorEvent ?? false)
  //     setStatus(event.status)
  //     setTimeInStart(event.timeInStart || "")
  //     setTimeInEnd(event.timeInEnd || "")
  //     setTimeOutStart(event.timeOutStart || "")
  //     setTimeOutEnd(event.timeOutEnd || "")
  //   }
  // }, [event])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !location.trim() || !date) {
      toast.error("Please fill in all required fields.")
      return
    }
    setLoading(true)
    await new Promise((r) => setTimeout(r, 600))
    toast.success("Event updated (mock)")
    onEventEdited()
    setLoading(false)
  }

  const handleOpenChange = (val: boolean) => {
    if (!loading) onOpenChange(val)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
          <DialogDescription>Update the details of this event.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" htmlFor="edit-ev-name">
              Event Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="edit-ev-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {/* Date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">
              Date <span className="text-destructive">*</span>
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading}
                  className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={setDate} autoFocus />
              </PopoverContent>
            </Popover>
          </div>

          {/* Location */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" htmlFor="edit-ev-loc">
              Location <span className="text-destructive">*</span>
            </label>
            <Input
              id="edit-ev-loc"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Status</label>
            <Select value={status} onValueChange={(v) => setStatus(v as EventStatus)} disabled={loading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Time In */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="edit-tis">Time-in Start</label>
              <Input id="edit-tis" type="time" value={timeInStart} onChange={(e) => setTimeInStart(e.target.value)} disabled={loading} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="edit-tie">Time-in End</label>
              <Input id="edit-tie" type="time" value={timeInEnd} onChange={(e) => setTimeInEnd(e.target.value)} disabled={loading} />
            </div>
          </div>

          {/* Time Out */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="edit-tos">Time-out Start</label>
              <Input id="edit-tos" type="time" value={timeOutStart} onChange={(e) => setTimeOutStart(e.target.value)} disabled={loading} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="edit-toe">Time-out End</label>
              <Input id="edit-toe" type="time" value={timeOutEnd} onChange={(e) => setTimeOutEnd(e.target.value)} disabled={loading} />
            </div>
          </div>

          {/* Note */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" htmlFor="edit-note">Notes</label>
            <Textarea
              id="edit-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>

          {/* Major Event */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="edit-major"
              checked={majorEvent}
              onCheckedChange={(v) => setMajorEvent(!!v)}
              disabled={loading}
            />
            <label htmlFor="edit-major" className="text-sm font-medium cursor-pointer">
              Mark as Major Event
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
