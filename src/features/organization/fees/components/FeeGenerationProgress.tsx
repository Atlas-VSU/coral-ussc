// FeeGenerationProgress.tsx
import { CheckCircle2, Loader2, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeeGenerationProgressProps {
  processedCount: number;   // raw count, e.g. 1800
  totalCount: number;        // e.g. 9000
  currentBatch: number;
  totalBatches: number;
}

const CONCURRENCY = 5;

export function FeeGenerationProgress({
  processedCount,
  totalCount,
  currentBatch,
  totalBatches,
}: FeeGenerationProgressProps) {
  const pct = totalCount > 0 ? Math.round((processedCount / totalCount) * 100) : 0;
  const isDone = processedCount >= totalCount && totalCount > 0;
  const nextEnd = Math.min(currentBatch + CONCURRENCY - 1, totalBatches);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#EAF3DE]">
          <Layers className="h-4 w-4 text-[#3B6D11]" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            {isDone ? "Generation complete" : "Generating fees"}
          </p>
          <p className="text-xs text-muted-foreground">
            {isDone
              ? "All records written and clearance statuses updated."
              : "Processing fee records in parallel batches..."}
          </p>
        </div>
      </div>

      {/* Stat chips */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Processed", value: processedCount.toLocaleString() },
          { label: "Total",     value: totalCount.toLocaleString() },
          { label: "Batch",     value: totalBatches > 0 ? `${currentBatch} / ${totalBatches}` : "—" },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-md bg-muted px-3 py-2">
            <p className="text-[11px] text-muted-foreground mb-0.5">{label}</p>
            <p className="text-lg font-medium tabular-nums leading-tight">{value}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between items-baseline mb-1.5">
          <span className="text-xs text-muted-foreground">Overall progress</span>
          <span className="text-xs font-medium tabular-nums">{pct}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${pct}%`, backgroundColor: "#3B6D11" }}
          />
        </div>
      </div>

      {/* Batch dots */}
      {totalBatches > 0 && (
        <div className="flex flex-wrap gap-1">
          {Array.from({ length: totalBatches }, (_, i) => {
            const done   = i < currentBatch - 1;
            const active = !done && i < currentBatch - 1 + CONCURRENCY;
            return (
              <div
                key={i}
                className={cn(
                  "h-2 w-2 rounded-full transition-colors duration-300",
                  done   ? "bg-[#3B6D11]"
                  : active ? "bg-[#97C459] animate-pulse"
                           : "bg-muted-foreground/20"
                )}
              />
            );
          })}
        </div>
      )}

      {/* Status / success row */}
      {isDone ? (
        <div className="flex items-center gap-2 rounded-md bg-green-50 border border-green-200 dark:bg-green-950 dark:border-green-800 px-3 py-2 text-xs text-green-700 dark:text-green-400">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          <span>Successfully generated fees for {totalCount.toLocaleString()} students.</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[#3B6D11]" />
          <span>
            {totalBatches > 0
              ? `Writing batches ${currentBatch}–${nextEnd} of ${totalBatches}...`
              : "Preparing batches..."}
          </span>
        </div>
      )}
    </div>
  );
}