import Image from "next/image";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

interface FeatureCardProps {
  icon: string;
  iconWhite: string;
  iconAlt: string;
  title: string;
  description: string;
  animationClass: string;
}

function FeatureCard({
  icon,
  iconWhite,
  iconAlt,
  title,
  description,
  animationClass,
}: FeatureCardProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Only show the themed icon after client-side hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use the default icon during server rendering and first mount
  // Only switch to the themed icon after hydration is complete
  const currentIcon = mounted && resolvedTheme === "dark" ? iconWhite : icon;

  return (
    <div
      className={`bg-white dark:bg-card border border-black/30 dark:border-border rounded-[16px] sm:rounded-[20px] lg:rounded-[22px] p-3 sm:p-4 lg:p-6 xl:p-8 backdrop-blur-sm shadow-sm dark:shadow-lg min-h-[140px] sm:min-h-[160px] lg:min-h-[180px] xl:min-h-[200px] flex items-center ${animationClass} overflow-hidden`}
    >
      <div className="flex items-center gap-3 sm:gap-4 lg:gap-6 w-full">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24 bg-gray-100 dark:bg-muted rounded-full flex items-center justify-center flex-shrink-0">
            <Image
              src={currentIcon}
              alt={iconAlt}
              width={32}
              height={32}
              className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 flex-shrink-0"
            />
          </div>
        </div>
        <div className="flex-1 min-w-0 overflow-hidden">
          <h3 className="font-instrument text-sm sm:text-base lg:text-lg xl:text-xl font-bold text-[#272727] dark:text-foreground leading-tight mb-1 sm:mb-2 lg:mb-3 break-words overflow-wrap-anywhere">
            {title}
          </h3>
          <p className="font-instrument text-xs sm:text-sm lg:text-base xl:text-lg text-[#5B5B5B] dark:text-muted-foreground leading-relaxed break-words overflow-wrap-anywhere overflow-hidden text-ellipsis">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

export function FeatureCards() {
  const features = [
    {
      icon: "/calendar.svg",
      iconWhite: "/calendar-white.svg",
      iconAlt: "Calendar icon",
      title: "Event Attendance Tracking",
      description:
        "Record attendance at meetings, seminars, and special events.",
      animationClass: "animate-fade-in-left animation-delay-600",
    },
    {
      icon: "/analytics.svg",
      iconWhite: "/analytics-white.svg",
      iconAlt: "Analytics icon",
      title: "Simple Attendance Analytics",
      description:
        "Instantly see how many members attended each event and track participation trends at a glance.",
      animationClass: "animate-fade-in-right animation-delay-800",
    },
  ];

  return (
    <div className="bg-white dark:bg-background px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fade-in-up animation-delay-400">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              iconWhite={feature.iconWhite}
              iconAlt={feature.iconAlt}
              title={feature.title}
              description={feature.description}
              animationClass={feature.animationClass}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
