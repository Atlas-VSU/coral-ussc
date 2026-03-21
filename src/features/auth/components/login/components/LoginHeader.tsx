import React from "react";

export function LoginHeader() {
  return (
    <div>
      {/* Mobile Header */}
      <header className="sm:hidden absolute inset-5 m-2 top-0 z-30 px-1 sm:px-6 py-0 flex items-center justify-between bg-white h-16">
        <div className="hero-left-clip relative overflow-hidden flex items-center">
          <img
            src="/images/main-banner-2.png"
            alt="USSC-Connect"
            className="h-12 w-auto object-contain"
          />
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden sm:flex absolute m-8 inset-3 top-0 z-10 px-6 sm:px-10 py-0 items-center justify-between bg-transparent h-20">
        <div className="inline-flex items-center gap-4 group">
          <img
            src="/images/main-banner-2.png"
            alt="USSC-Connect"
            className="ml-5 h-20 w-auto  object-contain"
          />
        </div>
      </header>
    </div>
  );
}
