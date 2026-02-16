"use client";

import { HeroSection, FeatureCards, CallToAction } from "@/features/auth/components/homepage";

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-background">
      <HeroSection />
      <FeatureCards />
      <CallToAction />
    </div>
  );
}
