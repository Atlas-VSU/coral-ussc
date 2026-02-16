import Image from "next/image";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface LoadingScreenProps {
  message?: string;
  className?: string;
  showDelayMessage?: boolean;
}

export function LoadingScreen({
  message = "Loading...",
  className,
  showDelayMessage = true,
}: LoadingScreenProps) {
  const [showDelayed, setShowDelayed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowDelayed(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={cn(
        "fixed inset-0 flex flex-col items-center justify-center bg-background z-50",
        className
      )}
    >
      <div className="bg-card p-8 rounded-xl shadow-xl flex flex-col items-center max-w-md mx-4 border border-border">
        <div className="w-24 h-24 relative mb-6">
          {/* Logo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Image
              src="/enhanced-logo-final.svg"
              alt="CORAL"
              width={64}
              height={64}
              className="w-16 h-16 object-contain"
              priority
            />
          </div>
          {/* Loader2 spinner overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-20 h-20 text-primary animate-spin opacity-70" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">CORAL</h3>
        <p className="text-base text-center text-foreground mb-4">{message}</p>
        {showDelayMessage && showDelayed && (
          <p className="text-sm text-muted-foreground text-center mt-2 animate-fade-in">
            This is taking longer than expected. Please wait a moment...
          </p>
        )}
      </div>
    </div>
  );
}
