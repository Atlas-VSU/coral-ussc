// MakePaymentButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function MakePaymentButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    setIsLoading(true);
    router.push("/payment");
  };

  return (
    <div className="flex justify-center lg:justify-start mt-8 mb-2 animate-fade-in-up delay-300">
      <button
        onClick={handleClick}
        disabled={isLoading}
        style={{
          background:
            "linear-gradient(to right, #8BC34A 0%, #2E7D32 100%, #1B5E20 100%)",
        }}
        className="
            relative inline-flex items-center gap-3
            px-8 py-4
            rounded-xl
            text-white font-bold text-base tracking-wide
            shadow-lg shadow-green-800/30
            hover:shadow-xl hover:shadow-green-800/40
            hover:scale-[1.03]
            active:scale-[0.98]
            transition-all duration-200 ease-out
            disabled:opacity-70 disabled:cursor-not-allowed
            overflow-hidden
            group
            
        "
      >
        {/* shimmer on hover */}
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 ease-in-out" />

        {isLoading ? (
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : (
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
            />
          </svg>
        )}

        <span className="text-base">
          {isLoading ? "Redirecting..." : "Make Payments"}
        </span>

        {!isLoading && (
          <svg
            className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
