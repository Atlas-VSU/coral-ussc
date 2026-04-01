"use client";

import Image from "next/image";

export default function MaintenancePage() {
  return (
    <div
      className="min-h-screen w-full relative overflow-hidden flex items-center justify-center animate-fade-in delay-200"
      style={{
        background:
          "linear-gradient(to bottom, #ffffff 0%, #ffffff 65%, #66bd4a 110%, #2E7D32 100%)",
      }}
    >
      {/* Main Content Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 w-full">
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-16 items-center min-h-[80vh]">
          {/* Mobile Image */}
          <div className="lg:hidden w-full flex justify-center items-center order-1 animate-fade-in-up animation-delay-200">
            <div className="w-full max-w-[300px] flex justify-center">
              <Image
                src="/images/ussc-logo-1.webp"
                alt="Maintenance"
                width={250}
                height={190}
                className="w-auto h-auto object-contain max-w-full max-h-[200px] lg:hidden"                
              />
            </div>
          </div>

          {/* Left Side - Content */}

          <div className="hidden lg:flex justify-center items-center order-3 lg:order-2 animate-fade-in-left animation-delay-400">            
              <Image  
                src="/images/ussc-logo-1.webp"
                alt="Maintenance Illustration"
                width={450}
                height={340}
                className="w-auto h-auto object-contain max-w-full max-h-[380px]"
                priority
              />
          </div>

          <div className="w-full max-w-lg mx-10 lg:mx-0 lg:max-w-none flex flex-col justify-center order-2 lg:order-1">
            {/* Headline block */}
            <div className="mb-4 lg:mb-6 text-center lg:text-left animate-fade-in-up animation-delay-300">
              <div className="font-montserrat text-8xl sm:text-9xl lg:text-[120px] font-bold leading-none mb-2 opacity-80 text-accent-foreground animation-fade-in-up animation-delay-300">
                Oops.
              </div>
              <h1 className="font-montserrat text-3xl sm:text-4xl lg:text-[42px] font-bold leading-tight mb-2 lg:mb-3 text-primary animate-fade-in-up animation-delay-400">
                Under Maintenance
              </h1>
              <p className="font-montserrat text-lg sm:text-xl lg:text-[24px] leading-relaxed text-primary animate-fade-in-up animation-delay-600 font-medium text-center lg:text-left">
                We're currently making improvements to the system. Everything
                will be back up and running shortly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
