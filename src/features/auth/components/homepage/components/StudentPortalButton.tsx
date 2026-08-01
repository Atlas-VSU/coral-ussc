"use client";

import { useState } from "react";
import { Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StudentPortalButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleRedirect = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate loading/establishing connection before redirection
    setTimeout(() => {
      window.location.href = "https://veris-student-portal.fc-ssc.online/";
    }, 1000);
  };

  return (
    <div className="flex justify-center lg:justify-start w-full mt-8 animate-fade-in-up delay-500">
      <Button
        onClick={handleRedirect}
        disabled={isLoading}
        className="group relative w-full sm:w-auto min-w-[240px] h-12 bg-linear-to-r from-[#8BC34A] to-[#2E7D32] hover:brightness-105 hover:shadow-lg active:scale-98 text-white font-bold text-sm sm:text-base rounded-xl transition-all duration-300 shadow-md disabled:opacity-90 disabled:cursor-not-allowed flex items-center justify-center gap-3 px-8 focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:ring-offset-2 overflow-hidden border border-[#2E7D32]/20"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
            <span>Connecting to Portal...</span>
          </span>
        ) : (
          <span className="flex items-center gap-2 justify-center w-full">
            <span>Go to Student Portal</span>
            <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        )}
      </Button>
    </div>
  );
}
