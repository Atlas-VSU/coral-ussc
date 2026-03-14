import { DesktopHeader } from "../DesktopHeader";
import { MobileHeader } from "../MobileHeader";

import LoginCard from "./components/LoginCard";

export function HomePageLayout() {
  return (
    <div className="flex min-h-svh flex-col relative">
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
            <div
              className="hero-left-clip flex-1 relative overflow-hidden lg:flex-none lg:w-[50%] flex items-center min-h-[65vh] lg:min-h-screen"
              // style={{
              //   background:
              //     "linear-gradient(135deg, #05621E 0%, #058C11 50%, #38B000 100%)",
              // }}
            >
              {/* <div
                className="absolute top-0 left-0 w-full h-screen z-0"
                style={{
                  backgroundImage: `url('/searchfortruth-2.png')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                }}
              /> */}
              {/* <div className="absolute top-20 left-10 w-32 h-32 bg-white/5 rounded-full blur-xl animate-float" />
              <div className="absolute bottom-20 right-10 w-24 h-24 bg-white/5 rounded-full blur-xl animate-float-delayed" />
              <div className="absolute top-1/2 right-20 w-16 h-16 bg-white/3 rounded-full blur-lg animate-gentle-rotate" /> */}

              <div className="relative z-10 w-full pt-28 pb-16 pl-6 pr-0 sm:px-10 lg:pt-0 lg:pb-0 lg:pl-16 lg:pr-10 lg:ml-10 mx-auto mr-0">
                {/* <p className="mb-3 sm:mb-4 lg:mb-6 text-xs sm:text-sm font-medium uppercase tracking-[0.25em] text-[#2E7D32] animate-fade-in-up text-center lg:text-left a">
                  University Supreme Student Council
                </p> */}
                <h1 className="text-4xl lg:text-[2.5rem] xl:text-[3.3rem] font-bold tracking-tight text-[#1F7700] leading-[1.1] animate-fade-in-up text-center lg:text-left">
                  Real-Time Eligibility.
                  <span className="block text-[#1F7700] font-bold">
                    Effortless Settlement.
                  </span>
                  <span className="block text-[#1F7700] font-bold ">
                    Total Clarity.
                  </span>
                </h1>
                <p className="mt-5 mr-10 sm:mt-6 lg:mt-8 text-md sm:text-base lg:text-md leading-snug text-[#1F7700] animate-fade-in-up delay-300 text-center font-medium lg:text-left">
                  Streamline your semestral clearance process by tracking your
                  organizational fees and fines, settle payments online, and
                  monitor your clearance status in real-time.
                </p>
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

              <div className="relative w-full max-w-2xl mx-auto px-4 lg:pr-8 h-[70vh] lg:h-[70vh] flex items-center justify-center">
                {/* <div className="absolute inset-0">
                  <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full blur-2xl animate-float" />
                  <div className="absolute bottom-10 right-10 w-40 h-40 bg-gradient-to-br from-secondary/10 to-accent/10 rounded-full blur-2xl animate-float-delayed" />
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-gradient-to-br from-warning/10 to-primary/10 rounded-full blur-xl animate-gentle-rotate" />

                  {/* geometric shapes */}
                {/*<div className="absolute top-20 right-20 w-16 h-16 bg-primary/5 rounded-full blur-sm animate-float" />
              <div className="absolute bottom-20 left-20 w-12 h-12 bg-secondary/5 rotate-45 animate-gentle-rotate" />
              <div className="absolute top-1/3 left-1/3 w-8 h-8 bg-accent/5 rounded-lg animate-float-delayed" />
              <div className="absolute bottom-1/3 right-1/3 w-6 h-6 bg-warning/5 rotate-12 animate-pulse" />
                </div> */}

                {/* Main Sign-in Card */}
                <div
                  className="absolute w-full h-full top-0 left-0 right-[30] z-3 animate-fade-in-up"
                  style={{
                    backgroundImage: `url('/images/searchfortruth-2.png')`,
                    backgroundSize: "contain",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }}
                />
                <LoginCard />
              </div>

              {/* Additional floating text elements */}
              {/* <div className="absolute top-16 left-8 opacity-20">
            <span className="text-6xl font-black text-primary/10 select-none">STUDENT</span>
          </div>
          <div className="absolute bottom-16 right-12 opacity-15">
            <span className="text-5xl font-bold text-secondary/10 select-none">COUNCIL</span>
          </div> */}

              {/* <div className="absolute top-8 right-8">
            <p className="text-xs text-muted-foreground/60 font-medium animate-fade-in delay-700 bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-white/40">
              Demo mode — presentation only
            </p>
          </div> */}
            </div>
          </div>

          {/* <footer
        className="relative z-10 border-t border-border/50 bg-white/50 backdrop-blur-sm px-6 py-6"
        style={{
          clipPath: "polygon(0 0, 100% 15%, 100% 100%, 0 100%)",
        }}
      >
        <div className="max-w-4xl mx-auto text-center transform -translate-y-4">
          <p className="text-sm text-muted-foreground font-medium">
            Atlas v1.0 — University Supreme Student Council
          </p>
        </div>
      </footer> */}
        </div>

        {/*mobile layout*/}
        <div className="lg:hidden flex flex-col min-h-svh"
        style={{
            background:
              "linear-gradient(to bottom, #ffffff 0%, #ffffff 25%, #ffffff 30%, #66bd4a 100%, #2E7D32 100%)",
          }}>
          {/* Top: green hero section with diagonal bottom cut */}
          <div
            className="hero-left-clip relative overflow-hidden flex items-center"
            // style={{
            //   background: "gradient(to top, #05621E 0%, #058C11 50%, #38B000 100%)",
            // }}
          >
            {/* Inline header — matches desktop style */}
            <MobileHeader />

            <div className="absolute top-20 left-10 w-32 h-32 bg-white/5 rounded-full blur-xl animate-float" />
            <div className="absolute bottom-20 right-10 w-24 h-24 bg-white/5 rounded-full blur-xl animate-float-delayed" />
            <div className="absolute top-1/2 right-20 w-16 h-16 bg-white/3 rounded-full blur-lg animate-gentle-rotate" />

            <div className="relative z-10 w-full pt-30 pb-20 px-6 sm:px-10 max-w-xl mx-auto">
              {/* <p className="mb-3 sm:mb-4 text-xs sm:text-sm font-medium uppercase tracking-[0.25em] text-white/80 animate-fade-in text-center">
                University Supreme Student Council
              </p> */}
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1F7700] leading-[0.95] animate-fade-in-up text-center whitespace-now">
                Real-Time Eligibility.
                <span className="block text-[#1F7700]">
                  Effortless Settlement.
                </span>
                <span className="block text-[#1F7700]">Total Clarity.</span>
              </h1>
              <p className="mt-5 sm:mt-6 text-md sm:text-base leading-relaxed text-[#1F7700] animate-fade-in-up delay-300 text-center">
                Streamline your semestral clearance process by tracking your
                organizational fees and fines, settle payments online, and
                monitor your clearance status in real-time.
              </p>
            </div>
          </div>

          {/* Bottom: white card section with background image */}
          <div className="flex-1 relative overflow-hidden flex items-center justify-center">
            {/* <div
              className="absolute inset-0 opacity-[0.02]"
              style={{
                backgroundImage: `
                  radial-gradient(circle at 20% 80%, #058C11 1px, transparent 1px),
                  radial-gradient(circle at 80% 20%, #38B000 1px, transparent 1px),
                  radial-gradient(circle at 40% 40%, #87D300 1px, transparent 1px)
                `,
                backgroundSize: "100px 100px",
              }}
            /> */}
            {/* <div
              className="absolute top-0 left-0 w-full h-full opacity-60 z-0 animate-fade-in"
              style={{
                backgroundImage: `url('/searchfortruth-2.png')`,
                backgroundSize: "contain",
                backgroundPosition: "bottom center",
                backgroundRepeat: "no-repeat",
              }}
            /> */}
            <div className="relative z-10 w-full max-w-2xl mx-auto px-4 pt-0 pb-25 flex items-center justify-center">
              <LoginCard />
            </div>
          </div>
        </div>
      </div>

      {/* <footer
        className="relative z-10 border-t border-border/50 bg-white/50 backdrop-blur-sm px-6 py-6"
        style={{
          clipPath: "polygon(0 0, 100% 15%, 100% 100%, 0 100%)",
        }}
      >
        <div className="max-w-4xl mx-auto text-center transform -translate-y-4">
          <p className="text-sm text-muted-foreground font-medium">
            Atlas v1.0 — University Supreme Student Council
          </p>
        </div>
      </footer> */}
    </div>
  );
}