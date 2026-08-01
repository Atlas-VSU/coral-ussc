import { DesktopHeader } from "./components/DesktopHeader";
import { MobileHeader } from "./components/MobileHeader";
import { TemporaryLogin } from "./components/TemporaryLogin";
import { StudentPortalButton } from "./components/StudentPortalButton";

import LoginCard from "./components/LoginCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";


export function HomePageLayout() {
  const [loading, setLoading] = useState(false);
  return (
    <div className="flex min-h-svh flex-col relative bg-white">
      <div>
        {/*Desktop layout*/}
        <div
          className="hidden lg:block"
          style={{
            background:
              "linear-gradient(to bottom right, #ffffff 0%, #ffffff 25%, #ffffff 30%, #66bd4a 100%, #2E7D32 100%)",
          }}
        >
          <DesktopHeader />
          <div className="relative min-h-screen flex flex-col lg:flex-row z-10">
            {/* Left Side */}
            <div className="hero-left-clip flex-1 relative overflow-hidden lg:flex-none lg:w-[50%] flex items-center min-h-[65vh] lg:min-h-screen">
              <div className="relative z-10 w-full pt-28 pb-16 pl-6 pr-0 sm:px-10 lg:pt-0 lg:pb-0 lg:pl-16 lg:pr-10 lg:ml-10 mx-auto mr-0">
                <h1 className="mb-4 text-4xl lg:text-[2.5rem] xl:text-[3.3rem] font-bold tracking-tight text-[#1F7700] leading-[1.1] animate-fade-in-up text-center lg:text-left">
                  Real-Time Eligibility.
                  <span className="block text-[#1F7700] font-bold">
                    Effortless Settlement.
                  </span>
                  <span className="block text-[#1F7700] font-bold">
                    Total Clarity.
                  </span>
                </h1>
                
                <p className="mt-5 mb-xl mr-10 sm:mt-6 lg:mt-8 text-md sm:text-base lg:text-md leading-snug text-[#1F7700] animate-fade-in-up delay-300 text-center font-medium lg:text-left">
                  Streamline your semestral clearance process by tracking your
                  organizational fees and fines, settle payments online, and
                  monitor your clearance status in real-time.
                </p>
                <StudentPortalButton />
              </div>
            </div>

            {/* Right Side */}
            <div className="flex-1 relative bg-transparent overflow-hidden flex items-center justify-center lg:flex-none lg:w-1/2">
              {/* Subtle background pattern */}
              <div
                className="absolute inset-0 opacity-[0.02] "
                style={{
                  backgroundImage: `
                radial-gradient(circle at 20% 80%, #058C11 1px, transparent 1px),
                radial-gradient(circle at 80% 20%, #38B000 1px, transparent 1px),
                radial-gradient(circle at 40% 40%, #87D300 1px, transparent 1px)
              `,
                  backgroundSize: "100px 100px",
                }}
              />

              <div className="relative w-full max-w-2xl mx-auto px-4 lg:pr-8 h-[70vh] lg:h-[80vh] flex items-center justify-center">
                {/* Main Sign-in Card */}
                {/* When login card is uncommented change top-0 */}
                <div
                  className="absolute w-full h-full top-5 left-0 right-[30] z-3 animate-fade-in-up"
                  style={{
                    backgroundImage: `url('/images/searchfortruth-2.png')`,
                    backgroundSize: "contain",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }}
                />

                {/* Temporary Login Admin Card */}
                <TemporaryLogin />
                {/* <LoginCard /> Uncomment if homepage with student login*/}
              </div>
            </div>
          </div>
        </div>

        {/*mobile layout*/}
        <div
          className="lg:hidden flex flex-col min-h-svh"
          style={{
            background:
              "linear-gradient(to bottom, #ffffff 0%, #ffffff 25%, #ffffff 30%, #66bd4a 100%, #2E7D32 100%)",
          }}
        >
          {/* Top: green hero section with diagonal bottom cut */}
          <div className="hero-left-clip relative overflow-hidden flex items-center">
            {/* Inline header — matches desktop style */}
            <MobileHeader />

            <div className="absolute top-20 left-10 w-32 h-32 bg-white/5 rounded-full blur-xl animate-float" />
            <div className="absolute bottom-20 right-10 w-24 h-24 bg-white/5 rounded-full blur-xl animate-float-delayed" />
            <div className="absolute top-1/2 right-20 w-16 h-16 bg-white/3 rounded-full blur-lg animate-gentle-rotate" />

            <div className="relative z-10 w-full pt-30 pb-20 px-6 sm:px-10 max-w-xl mx-auto">
              <h1 className="mb-8 text-4xl lg:text-[2.5rem] xl:text-[3.3rem] font-bold tracking-tight text-[#1F7700] leading-[1.1] animate-fade-in-up text-center lg:text-left">
                Real-Time Eligibility.
                <span className="block text-[#1F7700] font-bold">
                  Effortless Settlement.
                </span>
                <span className="block text-[#1F7700] font-bold">
                  Total Clarity.
                </span>
              </h1>
              <p className="mt-5 mb-xl mr-10 sm:mt-6 lg:mt-8 text-md sm:text-base lg:text-md leading-snug text-[#1F7700] animate-fade-in-up delay-300 text-center font-medium lg:text-left">
                Streamline your semestral clearance process by tracking your
                organizational fees and fines, settle payments online, and
                monitor your clearance status in real-time.
              </p>
              <StudentPortalButton />
            </div>
          </div>

          {/* Bottom: white card section with background image */}
          <div className="flex-1 relative overflow-hidden flex items-center justify-center">
            <div className="relative z-10 w-full max-w-2xl mx-auto px-4 pt-0 pb-25 flex items-center justify-center">
              {/* Main Sign-in Card */}
              <div
                className="absolute w-full h-full top-0 left-0 right-[30] z-3 animate-fade-in-up"
                // style={{
                //   backgroundImage: `url('/images/searchfortruth-2.png')`,
                //   backgroundSize: "contain",
                //   backgroundPosition: "center",
                //   backgroundRepeat: "no-repeat",
                // }}
              />
              {/* <LoginCard /> Uncomment if student login is available*/}
              <TemporaryLogin />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
