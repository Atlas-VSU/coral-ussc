import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <div className="relative px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Hero Image */}
        <div className="flex justify-center animate-fade-in-up animation-delay-200 px-4">
          <Image
            src="/images/students-vector.png"
            alt="Students collaborating and studying together"
            width={2470}
            height={800}
            className="w-full max-w-4xl sm:max-w-5xl lg:max-w-6xl h-auto object-contain"
            priority
          />
        </div>

        {/* Main Title */}
        <div className="text-center mt-2 mb-5 animate-fade-in-up animation-delay-400">
          <h1 className="font-nunito text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-black dark:text-foreground leading-[1.1] sm:leading-[1.15] lg:leading-tight tracking-tight break-words px-2">
            CORAL for Student Organizations
          </h1>
        </div>

        {/* Subtitle */}
        <div className="text-center mb-8 animate-fade-in-up animation-delay-600">
          <p className="font-nunito-sans text-base sm:text-lg lg:text-xl xl:text-2xl text-[#5B5B5B] dark:text-muted-foreground leading-relaxed max-w-4xl mx-auto font-medium tracking-wide break-words px-4">
            Centralized Online Record for Attendance and Logging
          </p>
        </div>

        {/* Login Button */}
        <div className="flex justify-center mb-8 sm:mb-13 animate-fade-in-up animation-delay-800">
          <Button
            asChild
            className="bg-[#008ACF] dark:bg-primary hover:bg-[#0f73a5] dark:hover:bg-primary/90 text-white dark:text-primary-foreground font-nunito-sans text-sm sm:text-base lg:text-lg xl:text-xl font-semibold px-8 sm:px-12 lg:px-16 xl:px-20 py-2 sm:py-3 lg:py-4 xl:py-5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl tracking-wide"
          >
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
