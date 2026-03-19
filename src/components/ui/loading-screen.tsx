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
        "fixed inset-0 flex flex-col items-center justify-center bg-background z-100 ",
        className,
      )}
      style={{
        background:
          "linear-gradient(to bottom right, #ffffff 0%, #ffffff 25%, #ffffff 30%, #66bd4a 100%, #2E7D32 100%)",
      }}
    >
      <div className="bg-white/20 p-8 rounded-xl shadow-xl flex flex-col items-center max-w-md mx-4 border border-border">
        <div className="w-24 h-24 relative mb-6 animate-pulse">
          {/* Logo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Image
              src="/images/ussc-logo-1.webp"
              alt="USSC CONNECT"
              width={64}
              height={64}
              className="w-16 h-16 object-contain"
              priority
            />
          </div>
          {/* Loader2 spinner overlay */}          
        </div>
        <h3 className="text-xl font-black text-accent-foreground mb-2">USSC CONNECT</h3>
        <p className="text-base font-medium text-center text-primary mb-4">{message}</p>
        {showDelayMessage && showDelayed && (
          <p className="text-sm text-muted-foreground text-center mt-2 animate-fade-in">
            This is taking longer than expected. Please wait a moment...
          </p>
        )}
      </div>
    </div>
  );
}
