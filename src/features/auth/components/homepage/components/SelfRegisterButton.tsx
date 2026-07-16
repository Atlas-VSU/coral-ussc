"use client";

import { useState } from "react";
import { ArrowRight, GraduationCap } from "lucide-react";
import { SelfRegisterDialog } from "./SelfRegisterDialog";

export function SelfRegisterButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex justify-center lg:justify-start mt-3 mb-2 animate-fade-in-up delay-300">
      <button
        onClick={() => setIsOpen(true)}
        className={`
            relative inline-flex items-center gap-3
            px-8 py-4
            rounded-xl
            font-bold text-base tracking-wide
            border-2 border-[#2E7D32]
            shadow-md shadow-green-800/10
            transition-all duration-200 ease-out
            group
            bg-white text-[#1F7700] hover:bg-[#2E7D32] hover:text-white hover:shadow-lg hover:shadow-green-800/30 hover:scale-[1.03] active:scale-[0.98]
        `}
      >
        <GraduationCap className="w-5 h-5" />
        <span className="text-base">Self-Register</span>
        <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
      </button>

      <SelfRegisterDialog isOpen={isOpen} onOpenChange={setIsOpen} />
    </div>
  );
}
