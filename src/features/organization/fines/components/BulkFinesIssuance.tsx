"use client";

import { useState } from "react";
import { CheckCircle, Clock, Upload, XCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { FineGenerationProgress } from "../types";
import { generateFinesOnEvent } from "@/firebase/fines/create/fines";
import { Event } from "../../events/types";
import { toast } from "sonner";

interface BulkFinesIssuanceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  event: Event;
}

export function BulkFinesIssuance({
  open,
  onOpenChange,
  onClose,
  event
}: BulkFinesIssuanceProps) {
  const [progress, setProgress] = useState<FineGenerationProgress | null>(null);

  const isRunning = progress?.phase === "preflight"
    || progress?.phase === "absent"
    || progress?.phase === "partial";
  const isDone  = progress?.phase === "done";
  const isError = progress?.phase === "error";

  const handleClose = () => {
    if (isRunning) return;
    setProgress(null);       // reset for next open
    onClose();
  };

  const handleIssuance = async () => {
    try {
      await generateFinesOnEvent(
        event,
        (update) => setProgress(update)  // each report() call triggers a re-render
      );
      toast.success("Fines generated successfully!");
    } catch (error) {
      console.error("Error during fine generation:", error);
      toast.error("An error occurred during fine generation. Please check the logs and try again.");
     }
  };

  // ── Derived percentages ──────────────────────────────────────────────────
  const absentPct = progress?.absentTotal
    ? Math.round((progress.absentDone / progress.absentTotal) * 100)
    : 0;

  const partialPct = progress?.partialTotal
    ? Math.round((progress.partialDone / progress.partialTotal) * 100)
    : 0;

  // Overall = combined done / combined total
  const totalDone  = (progress?.absentDone  ?? 0) + (progress?.partialDone  ?? 0);
  const totalUsers = (progress?.absentTotal ?? 0) + (progress?.partialTotal ?? 0);
  const overallPct = totalUsers > 0 ? Math.round((totalDone / totalUsers) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={isRunning || isDone ? undefined : handleClose}>
      <DialogContent className="max-w-2xl w-[90vw] overflow-y-auto max-h-[90vh] py-8">
        <DialogHeader className="space-y-4">
          <DialogTitle className="text-xl">Event Fines Issuance</DialogTitle>
          
          <div className="space-y-2">
            <DialogDescription>
              This will issue fines for all absent and possibly partially absent student members. 
              This may take some time, please do not close this dialog once started until the process is complete.
            </DialogDescription>

            
            
            <p className="pt-2 text-sm font-medium text-destructive animate-pulse">
              <span className="font-bold underline">Notice:</span> This issuance can only be done once to avoid complications.
            </p>
          </div>
        </DialogHeader>

         {/* ── RUNNING ─────────────────────────────────────────────────── */}
        {isRunning && progress && (
          <div className="space-y-6 py-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Generating Fines
                </CardTitle>
                <CardDescription>
                  {progress.message}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">

                {/* ── PREFLIGHT: indeterminate pulse bar ──────────────────────
                    Show this while we're still fetching users/fine-types.
                    Totals are 0 here so real bars would be misleading.      */}
                {progress.phase === "preflight" && (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Preparing…</span>
                      <span className="text-muted-foreground">Please wait</span>
                    </div>

                    {/* Indeterminate animated bar — no percentage needed */}
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden">
                      <div className="h-full w-1/3 bg-primary rounded-full animate-indeterminate" />
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Querying attendance records and fine documents…
                    </p>
                  </div>
                )}

                {/* ── ABSENT / PARTIAL: real determinate bars ─────────────── */}
                {progress.phase !== "preflight" && (
                  <>
                    {/* Overall bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Overall</span>
                        <span className="text-muted-foreground">
                          {overallPct}% — {totalDone.toLocaleString()} / {totalUsers.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div
                          className="bg-primary h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${overallPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Absent bar */}
                    {progress.absentTotal > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Absent users</span>
                          <span className="text-muted-foreground">
                            {absentPct}% — {progress.absentDone.toLocaleString()} / {progress.absentTotal.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                          <div
                            className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${absentPct}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Partial bar */}
                    {progress.partialTotal > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Partial attendees</span>
                          <span className="text-muted-foreground">
                            {partialPct}% — {progress.partialDone.toLocaleString()} / {progress.partialTotal.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                          <div
                            className="bg-violet-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${partialPct}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Batch counter */}
                    {progress.batchNum && progress.totalBatches && (
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>
                          {progress.phase === "absent" ? "Absent" : "Partial"} batch {progress.batchNum} of {progress.totalBatches}
                        </span>
                        <span>{totalDone.toLocaleString()} records written</span>
                      </div>
                    )}

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
                      <div>
                        <span className="text-muted-foreground">Absent users</span>
                        <p className="font-medium">{progress.absentTotal.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Partial attendees</span>
                        <p className="font-medium">{progress.partialTotal.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Committed</span>
                        <p className="font-medium">{totalDone.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Remaining</span>
                        <p className="font-medium">{(totalUsers - totalDone).toLocaleString()}</p>
                      </div>
                    </div>
                  </>
                )}

              </CardContent>
            </Card>
          </div>
        )}

                {/* ── DONE ────────────────────────────────────────────────────── */}
        {isDone && progress && (
          <div className="space-y-6 py-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  Generation Complete
                </CardTitle>
                <CardDescription>
                  All fine items have been written successfully.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Absent fines written</span>
                    <p className="font-medium">{progress.absentDone.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Partial fines written</span>
                    <p className="font-medium">{progress.partialDone.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total written</span>
                    <p className="font-medium">{(progress.absentDone + progress.partialDone).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status</span>
                    <p className="font-medium text-green-600">Success</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── ERROR ───────────────────────────────────────────────────── */}
        {isError && progress && (
          <div className="space-y-6 py-4">
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  Generation Failed
                </CardTitle>
                <CardDescription>{progress.message}</CardDescription>
              </CardHeader>
              <CardContent>

                {/* Preflight error — no records were ever written */}
                {totalUsers === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    The process failed during preparation before any records were written.
                    No data was modified.
                  </p>
                ) : (
                  /* Mid-batch error — show what was committed before it stopped */
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Absent committed</span>
                      <p className="font-medium">{progress.absentDone.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Partial committed</span>
                      <p className="font-medium">{progress.partialDone.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total committed</span>
                      <p className="font-medium">{totalDone.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Not written</span>
                      <p className="font-medium text-red-600">
                        {(totalUsers - totalDone).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isRunning}>
            {!isDone? "Cancel" : "Close"}
          </Button>
            {!isDone &&(
            <div>
            {!isRunning ? (
            <Button onClick={handleIssuance}>
              <Upload className="h-4 w-4 mr-2" />
              Issue Fines
            </Button>
          ) : (
            <Button disabled>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
              Processing...
            </Button>
          )}
          </div>  
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}