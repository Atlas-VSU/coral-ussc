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
import { LoaderIcon, InfoIcon, UserPlusIcon } from "lucide-react";
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
  } = useAddStudentForm({ suggestedId, onStudentAdded, open, onOpenChange });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center shadow-sm shrink-0"
              style={{
                background: "linear-gradient(135deg, #058C11, #38B000)",
              }}
            >
              <UserPlusIcon className="h-4 w-4 text-white" />
            </div>
            <div>
              <DialogTitle
                className="font-nunito text-base font-bold"
                style={{ color: "#27500A" }}
              >
                Add New Student
              </DialogTitle>
              <DialogDescription
                className="font-nunito-sans text-xs mt-0.5"
                style={{ color: "#3B6D11" }}
              >
                Enter the student details to add them to the system.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Divider */}
        <div
          className="h-px w-full"
          style={{
            background:
              "linear-gradient(to right, transparent, #97C459, transparent)",
          }}
        />

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Student ID */}
          <div className="space-y-1.5">
            <Label
              htmlFor="studentId"
              className="font-nunito-sans text-xs font-bold uppercase tracking-wider"
              style={{ color: "#3B6D11" }}
            >
              Student ID
            </Label>
            <Input
              id="studentId"
              name="studentId"
              value={formData.studentId}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="XX-X-XXXXX"
              style={{ borderColor: "#C0DD97" }}
            />
            {formErrors.studentId && (
              <p className="text-xs text-destructive">{formErrors.studentId}</p>
            )}
          </div>

          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="firstName"
                className="font-nunito-sans text-xs font-bold uppercase tracking-wider"
                style={{ color: "#3B6D11" }}
              >
                First Name
              </Label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                disabled={isSubmitting}
                style={{ borderColor: "#C0DD97" }}
              />
              {formErrors.firstName && (
                <p className="text-xs text-destructive">
                  {formErrors.firstName}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="lastName"
                className="font-nunito-sans text-xs font-bold uppercase tracking-wider"
                style={{ color: "#3B6D11" }}
              >
                Last Name
              </Label>
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                disabled={isSubmitting}
                style={{ borderColor: "#C0DD97" }}
              />
              {formErrors.lastName && (
                <p className="text-xs text-destructive">
                  {formErrors.lastName}
                </p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label
              htmlFor="email"
              className="font-nunito-sans text-xs font-bold uppercase tracking-wider"
              style={{ color: "#3B6D11" }}
            >
              Email Address
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              disabled={isSubmitting}
              style={{ borderColor: "#C0DD97" }}
            />
            {formErrors.email && (
              <p className="text-xs text-destructive">{formErrors.email}</p>
            )}
          </div>

          {/* Year Level */}
          <div className="space-y-1.5">
            <Label
              className="font-nunito-sans text-xs font-bold uppercase tracking-wider"
              style={{ color: "#3B6D11" }}
            >
              Year Level (Optional)
            </Label>
            <Select
              onValueChange={(value) =>
                handleChange({
                  target: {
                    name: "yearLevel",
                    value: value === "0" ? "0" : value,
                  },
                } as React.ChangeEvent<HTMLInputElement>)
              }
              value={formData.yearLevel ? formData.yearLevel.toString() : "0"}
              disabled={isSubmitting}
            >
              <SelectTrigger style={{ borderColor: "#C0DD97" }}>
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

          {/* Program */}
          <div className="space-y-1.5">
            <Label
              className="font-nunito-sans text-xs font-bold uppercase tracking-wider"
              style={{ color: "#3B6D11" }}
            >
              Program
            </Label>
            <Select
              onValueChange={handleSelectChange}
              value={formData.programId}
              disabled={isSubmitting}
            >
              <SelectTrigger style={{ borderColor: "#C0DD97" }}>
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
              <p className="text-xs text-destructive">{formErrors.programId}</p>
            )}
          </div>

          {/* Consent */}
          <div
            className="rounded-xl border p-4"
            style={{ background: "#EAF3DE", borderColor: "#97C459" }}
          >
            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={consentChecked}
                onCheckedChange={(checked) => {
                  setConsentChecked(checked as boolean);
                  if (checked) setShowConsentError(false);
                }}
                className="mt-0.5"
              />
              <div className="space-y-1">
                <Label
                  htmlFor="terms"
                  className="cursor-pointer font-nunito text-sm font-semibold"
                  style={{ color: "#27500A" }}
                >
                  I agree to the terms and conditions
                </Label>
                <p
                  className="font-nunito-sans text-xs leading-relaxed"
                  style={{ color: "#3B6D11" }}
                >
                  By checking this box, I consent to the collection and
                  processing of personal information for attendance tracking
                  purposes.
                </p>
              </div>
            </div>
            {showConsentError && (
              <p className="text-xs text-destructive mt-2">
                You must agree to the terms to continue.
              </p>
            )}
          </div>

          {/* Privacy notice */}
          <Alert
            className="border"
            style={{
              background: "#EAF3DE",
              borderColor: "#97C459",
              color: "#27500A",
            }}
          >
            <InfoIcon className="h-4 w-4" style={{ color: "#058C11" }} />
            <AlertDescription
              className="font-nunito-sans text-xs"
              style={{ color: "#3B6D11" }}
            >
              Your data will be used solely for attendance tracking and handled
              in accordance with our privacy policy.
            </AlertDescription>
          </Alert>

          <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="flex-1"
              style={{ borderColor: "#97C459", color: "#27500A" }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 text-white border-0"
              style={{
                background: "linear-gradient(135deg, #058C11, #38B000)",
              }}
            >
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
