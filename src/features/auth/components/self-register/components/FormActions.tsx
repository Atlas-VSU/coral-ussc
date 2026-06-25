import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FormActionsProps {
  isSubmitting: boolean;
  recaptchaVerified: boolean;
  agreed: boolean;
}

/** Back-to-home + submit button row at the bottom of the form. */
export function FormActions({ isSubmitting, recaptchaVerified, agreed }: FormActionsProps) {
  return (
    <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-between">
      <Button
        asChild
        variant="outline"
        type="button"
        disabled={isSubmitting}
      >
        <Link href="/">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </Button>
      <Button
        type="submit"
        variant="success"
        disabled={isSubmitting || !recaptchaVerified || !agreed}
        className="sm:min-w-[160px]"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit Registration"
        )}
      </Button>
    </div>
  );
}
