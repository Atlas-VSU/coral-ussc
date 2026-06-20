import { useEffect, useState } from "react";
import { LoadingButton } from "@/components/ui/loading-button";
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
import { FineType } from "../../fines/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EditEventDialogProps {
  open: boolean;
  fineTypes: FineType[];
  onOpenChange: (open: boolean) => void;
  onEventEdited: () => void;
  selectedEvent: Event | null;
}

const NAME_MAX = 50;
const NOTE_MAX = 100;

export function EditEventDialog({
  open,
  fineTypes,
  onOpenChange,
  onEventEdited,
  selectedEvent,
}: EditEventDialogProps) {
  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: "",
      date: undefined,
      fineTypeId: "",
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

  const watchedName = form.watch("name") ?? "";
  const watchedNote = form.watch("note") ?? "";
  const selectedFineTypeId = form.watch("fineTypeId");
  const isMajorEvent = form.watch("majorEvent");

  // Get the fine type object to check if timeIn/timeOut are required
  const selectedFineTypeObj = fineTypes.find((type) => type.id === selectedFineTypeId);
  const timeInRequired = selectedFineTypeObj?.requiresTimeIn || false;
  const timeOutRequired = selectedFineTypeObj?.requiresTimeOut || false;

  // Disable past dates in calendar
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    if (selectedEvent) {
      form.reset({
        name: selectedEvent.name,
        date: new Date(selectedEvent.date),
        fineTypeId: selectedEvent.fineTypeId,
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

    // Guard: majorEventsOnly fine type requires the event to be marked as major
    if (selectedFineTypeObj?.majorEventsOnly && !data.majorEvent) {
      form.setError("fineTypeId", {
        type: "manual",
        message: `"${selectedFineTypeObj.name}" is only for major events. Please mark this as a major event or choose a different fine type.`,
      });
      return;
    }

    // Guard: timeInStart and timeInEnd required when fine type requiresTimeIn
    if (timeInRequired) {
      let hasError = false;
      if (!data.timeInStart) {
        form.setError("timeInStart", {
          type: "manual",
          message: "Time-in Start is required for this fine type",
        });
        hasError = true;
      }
      if (!data.timeInEnd) {
        form.setError("timeInEnd", {
          type: "manual",
          message: "Time-in End is required for this fine type",
        });
        hasError = true;
      }
      if (data.timeInStart && data.timeInEnd && data.timeInEnd <= data.timeInStart) {
        form.setError("timeInEnd", {
          type: "manual",
          message: "Time-in End must be after Time-in Start",
        });
        hasError = true;
      }
      if (hasError) return;
    }

    // Guard: timeOutStart and timeOutEnd required when fine type requiresTimeOut
    if (timeOutRequired) {
      let hasError = false;
      if (!data.timeOutStart) {
        form.setError("timeOutStart", {
          type: "manual",
          message: "Time-out Start is required for this fine type",
        });
        hasError = true;
      }
      if (!data.timeOutEnd) {
        form.setError("timeOutEnd", {
          type: "manual",
          message: "Time-out End is required for this fine type",
        });
        hasError = true;
      }
      if (data.timeOutStart && data.timeOutEnd && data.timeOutEnd <= data.timeOutStart) {
        form.setError("timeOutEnd", {
          type: "manual",
          message: "Time-out End must be after Time-out Start",
        });
        hasError = true;
      }
      if (hasError) return;
    }

    try {
      setLoading(true);
      await updateEvent(selectedEvent.id.toString(), data);
      toast.success("Event updated successfully!");
      onEventEdited();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Error updating event:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = () => {
    if (!loading) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
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
              {/* Event Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Event Name</FormLabel>
                      <span
                        className={cn(
                          "text-xs tabular-nums",
                          watchedName.length > NAME_MAX
                            ? "text-destructive"
                            : "text-muted-foreground"
                        )}
                      >
                        {watchedName.length}/{NAME_MAX}
                      </span>
                    </div>
                    <FormControl>
                      <Input
                        placeholder="Enter event name"
                        {...field}
                        disabled={loading}
                        maxLength={NAME_MAX}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Event Date — future only */}
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
                          disabled={(date) => date < today || loading}
                          autoFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Fine Type */}
              <FormField
                control={form.control}
                name="fineTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type of Fines</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a type of fines" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {fineTypes.map((type: FineType) => (
                          <SelectItem key={type.id} value={type.id!}>
                            {type.name}
                            {type.majorEventsOnly && (
                              <span className="ml-2 text-xs text-amber-600 font-medium">(Major Events Only)</span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                    {/* Inline warning when majorEventsOnly fine type is selected but event isn't marked major */}
                    {selectedFineTypeObj?.majorEventsOnly && !isMajorEvent && (
                      <p className="text-xs text-amber-600 mt-1">
                        ⚠️ This fine type is only applicable to major events. Please mark this event as a major event below.
                      </p>
                    )}
                  </FormItem>
                )}
              />

              {/* Time-in fields — shown + required when fine type requiresTimeIn */}
              {timeInRequired && (
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="timeInStart"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Time-in Start
                          <span className="text-destructive ml-1">*</span>
                        </FormLabel>
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
                        <FormLabel>
                          Time-in End
                          <span className="text-destructive ml-1">*</span>
                        </FormLabel>
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
              )}

              {/* Time-out fields — shown + required when fine type requiresTimeOut */}
              {timeOutRequired && (
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="timeOutStart"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Time-out Start
                          <span className="text-destructive ml-1">*</span>
                        </FormLabel>
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
                        <FormLabel>
                          Time-out End
                          <span className="text-destructive ml-1">*</span>
                        </FormLabel>
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
              )}

              {/* Location */}
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

              {/* Note */}
              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Note (Optional)</FormLabel>
                      <span
                        className={cn(
                          "text-xs tabular-nums",
                          (watchedNote?.length ?? 0) > NOTE_MAX
                            ? "text-destructive"
                            : "text-muted-foreground"
                        )}
                      >
                        {watchedNote?.length ?? 0}/{NOTE_MAX}
                      </span>
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder="Add notes or instructions for this event"
                        className="resize-none"
                        {...field}
                        disabled={loading}
                        maxLength={NOTE_MAX}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Major Event */}
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
                <LoadingButton
                  variant="outline"
                  type="button"
                  onClick={handleOpenChange}
                  disabled={loading}
                >
                  Cancel
                </LoadingButton>
                <LoadingButton
                  type="submit"
                  variant="success"
                  isLoading={loading}
                  loadingText="Updating..."
                >
                  Update Event
                </LoadingButton>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}