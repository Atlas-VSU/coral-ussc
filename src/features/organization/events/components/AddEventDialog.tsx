"use client"

import { useState } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface AddEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onEventAdded: () => void
}

export function AddEventDialog({ open, onOpenChange, onEventAdded }: AddEventDialogProps) {
  const [loading, setLoading] = useState(false)
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [name, setName] = useState("")
  const [location, setLocation] = useState("")
  const [note, setNote] = useState("")
  const [majorEvent, setMajorEvent] = useState(false)
  const [timeInStart, setTimeInStart] = useState("")
  const [timeInEnd, setTimeInEnd] = useState("")
  const [timeOutStart, setTimeOutStart] = useState("")
  const [timeOutEnd, setTimeOutEnd] = useState("")

  const resetForm = () => {
    setDate(undefined)
    setName("")
    setLocation("")
    setNote("")
    setMajorEvent(false)
    setTimeInStart("")
    setTimeInEnd("")
    setTimeOutStart("")
    setTimeOutEnd("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !location.trim() || !date) {
      toast.error("Please fill in all required fields.")
      return
    }
    setLoading(true)
    await new Promise((r) => setTimeout(r, 600))
    toast.success("Event created (mock)")
    onEventAdded()
    onOpenChange(false)
    resetForm()
    setLoading(false)
  }

  const handleOpenChange = (val: boolean) => {
    if (!loading) {
      onOpenChange(val)
      if (!val) resetForm()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-125 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Event</DialogTitle>
          <DialogDescription>Create a new event for your organization.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" htmlFor="ev-name">
              Event Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="ev-name"
              placeholder="e.g. State of the Student Address"
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
            <label className="text-sm font-medium" htmlFor="ev-loc">
              Location <span className="text-destructive">*</span>
            </label>
            <Input
              id="ev-loc"
              placeholder="Venue"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {/* Time In */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="ev-tis">Time-in Start</label>
              <Input id="ev-tis" type="time" value={timeInStart} onChange={(e) => setTimeInStart(e.target.value)} disabled={loading} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="ev-tie">Time-in End</label>
              <Input id="ev-tie" type="time" value={timeInEnd} onChange={(e) => setTimeInEnd(e.target.value)} disabled={loading} />
            </div>
          </div>

          {/* Time Out */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="ev-tos">Time-out Start</label>
              <Input id="ev-tos" type="time" value={timeOutStart} onChange={(e) => setTimeOutStart(e.target.value)} disabled={loading} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="ev-toe">Time-out End</label>
              <Input id="ev-toe" type="time" value={timeOutEnd} onChange={(e) => setTimeOutEnd(e.target.value)} disabled={loading} />
            </div>
          </div>

          {/* Note */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" htmlFor="ev-note">Notes</label>
            <Textarea
              id="ev-note"
              placeholder="Additional notes..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>

          {/* Major Event */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="ev-major"
              checked={majorEvent}
              onCheckedChange={(v) => setMajorEvent(!!v)}
              disabled={loading}
            />
            <label htmlFor="ev-major" className="text-sm font-medium cursor-pointer">
              Mark as Major Event
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating…</> : "Create Event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}