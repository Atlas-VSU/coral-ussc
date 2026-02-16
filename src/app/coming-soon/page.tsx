"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Home, ArrowLeft, Clock, Wrench } from "lucide-react";

export default function ComingSoon() {
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    // Check if we can go back in browser history
    setCanGoBack(window.history.length > 1);
  }, []);

  const handleGoBack = () => {
    if (typeof window !== "undefined" && canGoBack) {
      window.history.back();
    }
  };

  return (
    <div className="min-h-screen w-full bg-white dark:bg-background relative overflow-hidden flex items-center justify-center animate-fade-in">
      {/* Main Content Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 w-full">
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-16 items-center min-h-[80vh]">
          {/* Mobile Image - Shows on top for mobile */}
          <div className="lg:hidden w-full flex justify-center items-center order-1 animate-fade-in-up animation-delay-200">
            <div className="w-full max-w-[300px] flex justify-center">
              <div className="w-[250px] h-[190px] bg-gradient-to-br from-[#008ACF]/10 to-[#008ACF]/5 dark:from-primary/20 dark:to-primary/10 rounded-2xl flex items-center justify-center">
                <Wrench className="w-20 h-20 text-[#008ACF] dark:text-primary animate-pulse" />
              </div>
            </div>
          </div>

          {/* Left Side - Coming Soon Content */}
          <div className="w-full max-w-lg mx-auto lg:mx-0 lg:max-w-none flex flex-col justify-center order-2 lg:order-1">
            {/* Coming Soon Header */}
            <div className="mb-4 lg:mb-6 text-center lg:text-left animate-fade-in-up animation-delay-300">
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                <Clock className="w-12 h-12 text-[#008ACF] dark:text-primary animate-pulse" />
                <div className="font-nunito text-4xl sm:text-5xl lg:text-6xl font-bold text-[#008ACF] dark:text-primary leading-none opacity-80">
                  Coming Soon
                </div>
              </div>
              <p className="font-nunito text-lg sm:text-xl lg:text-[24px] text-[#5B5B5B] dark:text-muted-foreground leading-relaxed">
                We&apos;re working hard to bring you this feature. 
                Stay tuned for updates!
              </p>
            </div>

            {/* Action Buttons Container */}
            <div className="bg-white dark:bg-card border border-[#767676] dark:border-border rounded-[30px] lg:rounded-[40px] p-6 sm:p-7 lg:p-8 w-full max-w-[520px] mx-auto lg:mx-0 shadow-lg dark:shadow-2xl animate-fade-in-up animation-delay-500">
              {/* Suggested Actions */}
              <div className="space-y-4 animate-fade-in-up animation-delay-600">
                <h2 className="font-nunito text-xl text-[#272727] dark:text-foreground mb-4">
                  What would you like to do?
                </h2>

                {/* Go Home Button */}
                <Link
                  href="/org-dashboard"
                  className="w-full h-[50px] bg-[#008ACF] dark:bg-primary text-white dark:text-primary-foreground font-nunito text-[16px] rounded-xl hover:bg-[#0f73a5] dark:hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3 group"
                >
                  <Home className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  Go to Dashboard
                </Link>

                {/* Go Back Button */}
                <button
                  onClick={handleGoBack}
                  disabled={!canGoBack}
                  className="w-full h-[50px] border border-[#696969] dark:border-border bg-white dark:bg-input text-[#272727] dark:text-foreground font-nunito text-[16px] rounded-xl hover:bg-gray-50 dark:hover:bg-accent transition-all duration-200 flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  Go Back
                </button>
              </div>
            </div>
          </div>

          {/* Right Side - Illustration (Desktop only) */}
          <div className="hidden lg:flex justify-center items-center order-3 lg:order-2 animate-fade-in-left animation-delay-400">
            <div className="w-full max-w-[750px] flex justify-center">
              <div className="w-[450px] h-[340px] bg-gradient-to-br from-[#008ACF]/10 to-[#008ACF]/5 dark:from-primary/20 dark:to-primary/10 rounded-3xl flex items-center justify-center relative overflow-hidden">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-10 left-10 w-16 h-16 border-2 border-[#008ACF] dark:border-primary rounded-full animate-pulse"></div>
                  <div className="absolute top-20 right-16 w-8 h-8 bg-[#008ACF] dark:bg-primary rounded-full animate-bounce animation-delay-300"></div>
                  <div className="absolute bottom-20 left-20 w-12 h-12 border-2 border-[#008ACF] dark:border-primary rounded-lg animate-pulse animation-delay-600"></div>
                  <div className="absolute bottom-16 right-12 w-6 h-6 bg-[#008ACF] dark:bg-primary rounded-full animate-bounce animation-delay-900"></div>
                </div>
                
                {/* Main icon */}
                <div className="relative z-10 flex flex-col items-center gap-6">
                  <Wrench className="w-32 h-32 text-[#008ACF] dark:text-primary animate-pulse" />
                  <div className="flex gap-2">
                    <div className="w-3 h-3 bg-[#008ACF] dark:bg-primary rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-[#008ACF] dark:bg-primary rounded-full animate-bounce animation-delay-200"></div>
                    <div className="w-3 h-3 bg-[#008ACF] dark:bg-primary rounded-full animate-bounce animation-delay-400"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
