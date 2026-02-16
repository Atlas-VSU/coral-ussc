import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoaderIcon, InfoIcon } from "lucide-react";
import { Member } from "@/features/organization/members/types";
import { useAddStudentForm } from "../hooks/useAddStudentForm";

interface AddStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestedId: string;
  onStudentAdded: (student: Member) => void;
}

export function AddStudentDialog({
  open,
  onOpenChange,
  suggestedId,
  onStudentAdded,
}: AddStudentDialogProps) {
  const {
    formData,
    consentChecked,
    setConsentChecked,
    showConsentError,
    setShowConsentError,
    isSubmitting,
    formErrors,
    handleChange,
    handleSubmit,
    programData,
    handleSelectChange,
  } = useAddStudentForm({
    suggestedId,
    onStudentAdded,
    open,
    onOpenChange,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
          <DialogDescription>
            Enter the student details to add them to the system.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="studentId">Student ID</Label>
            <Input
              id="studentId"
              name="studentId"
              value={formData.studentId}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="XX-X-XXXXX"
            />
            {formErrors.studentId && (
              <p className="text-sm text-destructive">{formErrors.studentId}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              {formErrors.firstName && (
                <p className="text-sm text-destructive">
                  {formErrors.firstName}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              {formErrors.lastName && (
                <p className="text-sm text-destructive">
                  {formErrors.lastName}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            {formErrors.email && (
              <p className="text-sm text-destructive">{formErrors.email}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="yearLevel">Year Level (Optional)</Label>
            <Select
              onValueChange={(value) => {
                handleChange({
                  target: {
                    name: "yearLevel",
                    value: value === "0" ? "0" : value,
                  },
                } as React.ChangeEvent<HTMLInputElement>);
              }}
              value={formData.yearLevel ? formData.yearLevel.toString() : "0"}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select year level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">None</SelectItem>
                <SelectItem value="1">1st Year</SelectItem>
                <SelectItem value="2">2nd Year</SelectItem>
                <SelectItem value="3">3rd Year</SelectItem>
                <SelectItem value="4">4th Year</SelectItem>
                <SelectItem value="5">5th Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Program</Label>
            <Select
              onValueChange={handleSelectChange}
              value={formData.programId}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a program" />
              </SelectTrigger>
              <SelectContent>
                {programData.map((program) => (
                  <SelectItem key={program.id} value={program.id}>
                    {program.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors.programId && (
              <p className="text-sm text-destructive">{formErrors.programId}</p>
            )}
          </div>

          <div className="border rounded-md p-4 bg-muted/50">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="terms"
                checked={consentChecked}
                onCheckedChange={(checked) => {
                  setConsentChecked(checked as boolean);
                  if (checked) setShowConsentError(false);
                }}
                aria-label="Agree to terms and conditions"
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="terms" className="cursor-pointer">
                  I agree to the terms and conditions
                </Label>
                <p className="text-sm text-muted-foreground">
                  By checking this box, I consent to the collection and
                  processing of my personal information for attendance tracking
                  purposes.
                </p>
              </div>
            </div>
            {showConsentError && (
              <p className="text-sm text-destructive mt-2">
                You must agree to the terms to continue.
              </p>
            )}
          </div>

          <Alert
            variant="default"
            className="bg-blue-50 border-blue-200 text-blue-800"
          >
            <InfoIcon className="h-4 w-4" />
            <AlertDescription className="text-blue-700">
              Your data will be used solely for attendance tracking and handled
              in accordance with our privacy policy.
            </AlertDescription>
          </Alert>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Student"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
