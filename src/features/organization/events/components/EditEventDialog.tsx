import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { EventFormData, eventSchema } from "@/lib/validators";
import { updateEvent } from "@/firebase";
import { useForm } from "react-hook-form";
import { Event } from "../types";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { toast } from "sonner";

interface EditEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventEdited: () => void;
  selectedEvent: Event | null;
}

export function EditEventDialog({
  open,
  onOpenChange,
  onEventEdited,
  selectedEvent,
}: EditEventDialogProps) {
  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: "",
      date: undefined,
      location: "",
      timeInStart: "",
      timeInEnd: "",
      timeOutStart: "",
      timeOutEnd: "",
      note: "",
      majorEvent: false,
    },
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedEvent) {
      form.reset({
        name: selectedEvent.name,
        date: new Date(selectedEvent.date),
        location: selectedEvent.location,
        majorEvent: selectedEvent.majorEvent,
        note: selectedEvent.note || "",
        timeInStart: selectedEvent.timeInStart || "",
        timeInEnd: selectedEvent.timeInEnd || "",
        timeOutStart: selectedEvent.timeOutStart || "",
        timeOutEnd: selectedEvent.timeOutEnd || "",
      });
    }
  }, [selectedEvent, form]);

  const onSubmit = async (data: EventFormData) => {
    if (!selectedEvent) return;

    try {
      setLoading(true);
      await updateEvent(selectedEvent.id.toString(), data);
      toast.success("Event updated successfully!");
      onEventEdited();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Error updating event:", error);
      // Extract error message from the error object
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (!loading) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={loading ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-[500px] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Update Event</DialogTitle>
          <DialogDescription>
            Update the details of the event below.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <LoadingOverlay loading={loading} message="Updating event..." />

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid gap-4 py-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter event name"
                        {...field}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Event Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild disabled={loading}>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground",
                              loading && "opacity-50 cursor-not-allowed"
                            )}
                            disabled={loading}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={loading}
                          autoFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="timeInStart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time-in Start</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          value={field.value || ""}
                          disabled={loading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="timeInEnd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time-in End</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          value={field.value || ""}
                          disabled={loading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="timeOutStart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time-out Start</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          value={field.value || ""}
                          disabled={loading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="timeOutEnd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time-out End</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          value={field.value || ""}
                          disabled={loading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter event location"
                        {...field}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add notes or instructions for this event"
                        className="resize-none"
                        {...field}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="majorEvent"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={loading}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Mark as a major event</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  variant="outline"
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  Update Event
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
