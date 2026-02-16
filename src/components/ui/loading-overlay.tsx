import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingOverlayProps {
  loading: boolean;
  message?: string;
  className?: string;
}

export function LoadingOverlay({
  loading,
  message = "Please wait...",
  className,
}: LoadingOverlayProps) {
  if (!loading) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-50 rounded-md",
        className
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-2 text-sm font-medium text-muted-foreground">
        {message}
      </p>
    </div>
  );
}
