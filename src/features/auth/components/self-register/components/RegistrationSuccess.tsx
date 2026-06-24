import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/** Shown after a successful self-registration submission. */
export function RegistrationSuccess() {
  return (
    <div className="min-h-screen bg-[#1B5E20]/5 dark:bg-background flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-sm">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-9 w-9 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-[#1B5E20]">
            Registration Submitted
          </h2>
          <p className="text-sm text-muted-foreground">
            Thanks for registering! Your application has been received and is
            now <span className="font-semibold">pending verification</span> by
            your organization. You&apos;ll be notified once it&apos;s reviewed.
          </p>
          <Button asChild variant="success" className="mt-2 w-full">
            <Link href="/">Back to Home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
