"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import Link from "next/link";
import { LucideIcon } from "lucide-react";
import React from "react";

// Accept either LucideIcon or a function component that returns JSX
type IconType = LucideIcon | React.FC<{ className?: string }>;

interface IconMap {
  [key: string]: IconType;
}

interface NavLink {
  label: string;
  icon: string;
  href: string;
}

interface MobileBottomNavProps {
  links: NavLink[];
  iconMap: IconMap;
}

export function MobileBottomNav({ links, iconMap }: MobileBottomNavProps) {
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t flex justify-around py-2 shadow-lg">
      {links.map(({ label, icon, href }) => {
        const Icon = iconMap[icon];
        return Icon ? (
          <Link
            key={label}
            href={href}
            className="flex flex-col items-center text-xs text-muted-foreground hover:text-primary transition-colors p-1"
          >
            <Icon className="w-5 h-5 mb-1" />
            {label}
          </Link>
        ) : null;
      })}
    </nav>
  );
}
