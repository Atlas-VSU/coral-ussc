import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface AuthLoadingOverlayProps {
  loading: boolean;
  message: string;
  className?: string;
}

export function AuthLoadingOverlay({
  loading,
  message,
  className,
}: AuthLoadingOverlayProps) {
  const [showDelayedMessage, setShowDelayedMessage] = useState(false);

  useEffect(() => {
    // After 3 seconds, show an additional message for slow connections
    const timer = setTimeout(() => {
      if (loading) {
        setShowDelayedMessage(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [loading]);

  if (!loading) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur-md z-[9999]", // Higher z-index
        className
      )}
      // Prevent any accidental clicks from dismissing the overlay
      onClick={(e) => e.preventDefault()}
    >
      <div className="bg-card p-6 rounded-lg shadow-lg flex flex-col items-center max-w-md mx-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg font-semibold text-foreground text-center">
          {message}
        </p>

        {showDelayedMessage && (
          <p className="mt-4 text-sm text-muted-foreground text-center">
            This is taking longer than expected. Please wait...
          </p>
        )}
      </div>
    </div>
  );
}
