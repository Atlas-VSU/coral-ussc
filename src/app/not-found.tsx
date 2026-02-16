"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
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
              <Image
                src="/images/404-img.png"
                alt="CORAL Logo"
                width={250}
                height={190}
                className="w-auto h-auto object-contain max-w-full max-h-[200px]"
                priority
              />
            </div>
          </div>

          {/* Left Side - 404 Content */}
          <div className="w-full max-w-lg mx-auto lg:mx-0 lg:max-w-none flex flex-col justify-center order-2 lg:order-1">
            {/* 404 Number */}
            <div className="mb-4 lg:mb-6 text-center lg:text-left animate-fade-in-up animation-delay-300">
              <div className="font-nunito text-8xl sm:text-9xl lg:text-[120px] font-bold text-[#008ACF] dark:text-primary leading-none mb-2 opacity-80">
                404
              </div>
              <h1 className="font-nunito text-3xl sm:text-4xl lg:text-[42px] font-bold text-black dark:text-foreground leading-tight mb-2 lg:mb-3">
                Page Not Found
              </h1>
              <p className="font-nunito text-lg sm:text-xl lg:text-[24px] text-[#5B5B5B] dark:text-muted-foreground leading-relaxed">
                The page you&apos;re looking for doesn&apos;t exist or has been
                moved.
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
                  href="/"
                  className="w-full h-[50px] bg-[#008ACF] dark:bg-primary text-white dark:text-primary-foreground font-nunito text-[16px] rounded-xl hover:bg-[#0f73a5] dark:hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3 group"
                >
                  <Home className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  Go to Homepage
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
              <Image
                src="/images/404-img.png"
                alt="CORAL Logo"
                width={450}
                height={340}
                className="w-auto h-auto object-contain max-w-full max-h-[380px]"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
