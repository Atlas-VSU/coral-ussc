"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UpdateStudentRecordForm } from "@/features/auth/components/update-record/UpdateStudentRecordForm";
import { useVerifyUpdateToken } from "./hooks/useVerifyUpdateToken";

function UpdateRecordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const { status, data, errorMessage } = useVerifyUpdateToken(token);

  if (status === "idle" || status === "verifying") {
    return (
      <div className="min-h-screen bg-[#1B5E20]/5 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="w-10 h-10 text-[#2E7D32] animate-spin" />
          <h2 className="text-lg font-bold text-[#1B5E20]">
            Verifying your update link…
          </h2>
          <p className="text-sm text-muted-foreground">
            Please wait while we validate your access.
          </p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-[#1B5E20]/5 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg bg-white border !border-red-200 p-0">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-red-600 mb-2">
              Access Denied
            </h2>
            <p className="text-sm text-gray-600 mb-6">{errorMessage}</p>
            <Button
              onClick={() => router.push("/")}
              className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white flex items-center gap-2 font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <UpdateStudentRecordForm
      token={token!}
      studentId={data!.studentId}
      email={data!.email}
      initialValues={data!.student}
    />
  );
}

export default function UpdateRecordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#1B5E20]/5 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#2E7D32] animate-spin" />
        </div>
      }
    >
      <UpdateRecordContent />
    </Suspense>
  );
}
