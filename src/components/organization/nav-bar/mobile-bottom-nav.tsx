"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import React from "react";
import { cacheUtils } from "@/utils/cacheUtils";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase/firebase.config";

// Accept either LucideIcon or a function component that returns JSX
type IconType = LucideIcon | React.FC<{ className?: string }>;

interface IconMap {
  [key: string]: IconType;
}

interface NavLink {
  label: string;
  icon: string;
  href: string;
  /** Optional action identifier. When set, clicking this link calls `onAction(action)` instead of (or in addition to) navigating. */
  action?: string;
}

interface MobileBottomNavProps {
  links: NavLink[];
  iconMap: IconMap;
  /** Called when a link with an `action` is tapped. Use this to e.g. sign the user out. */
  onAction?: (action: string) => void;
}

export function MobileBottomNav({ links, iconMap, onAction }: MobileBottomNavProps) {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const [showMore, setShowMore] = React.useState(false);

  if (!isMobile) return null;

  const moreLabels = new Set(["members", "fees", "fines", "clearance"]);
  const visibleLinks = links.filter((link) => !moreLabels.has(link.label.trim().toLowerCase()));
  const overflowLinks = links.filter((link) => moreLabels.has(link.label.trim().toLowerCase()));
  const hasOverflow = overflowLinks.length > 0;

  const isActiveRoute = (href: string) => {
    if (!pathname) return false;
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleAction = async (action: string) => {
    if(action==="signout"){
       cacheUtils.setSigningOut(true);

      // Use centralized cache clearing utility
      cacheUtils.clearOnLogout();

      // Run Firebase signout and session cookie clear in parallel
      const [, sessionResponse] = await Promise.allSettled([
        signOut(auth),
        fetch("/api/auth/signout", {
          method: "POST",
          credentials: "include",
        }),
      ]);

      if (sessionResponse.status === "fulfilled" && !sessionResponse.value.ok) {
        console.warn(
          "API signout encountered an issue, continuing logout process",
        );
      }

      // Use a reload approach for a clean slate
      window.location.href = "/?logout=true";
    }
  };

  const renderNavLink = ({ label, icon, href, action }: NavLink, compact = false) => {
    const Icon = iconMap[icon];
    if (!Icon) return null;
    const isActive = isActiveRoute(href);

    const className = `flex min-w-0 flex-col items-center transition-colors ${compact ? "px-1 py-1 text-[10px] leading-tight" : "p-1 text-xs"} ${isActive ? "rounded-md bg-primary/10 text-primary" : "text-muted-foreground hover:text-primary"}`;

    // Links with an `action` run custom logic (e.g. sign out) instead of plain navigation.
    if (action) {
      return (
        <button
          key={label}
          type="button"
          onClick={async () => {
            setShowMore(false);
            await handleAction(action!)
          }}
          className={className}
        >
          <Icon className={`mb-1 ${compact ? "h-4 w-4" : "h-5 w-5"}`} />
          <span className="truncate">{label}</span>
        </button>
      );
    }

    return (
      <Link
        key={label}
        href={href}
        onClick={() => setShowMore(false)}
        className={className}
      >
        <Icon className={`mb-1 ${compact ? "h-4 w-4" : "h-5 w-5"}`} />
        <span className="truncate">{label}</span>
      </Link>
    );
  };

  return (
    <>
      {hasOverflow && showMore && (
        <>
          <button
            type="button"
            aria-label="Close more navigation"
            onClick={() => setShowMore(false)}
            className="fixed inset-0 z-40 hidden max-[420px]:block bg-black/35"
          />

          <div className="fixed inset-x-0 z-50 hidden max-[420px]:block px-2" style={{ bottom: "calc(4rem + env(safe-area-inset-bottom) + 0.25rem)" }}>
            <div className="rounded-xl border-2 border-border bg-card p-2 shadow-2xl ring-1 ring-black/10">
              <div className="mb-1 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                More Navigation
              </div>
              <div className="grid grid-cols-2 gap-1">
                {overflowLinks.map((link) => (
                  <div key={`overflow-${link.label}`} className="rounded-md hover:bg-muted/60">
                    {renderNavLink(link)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card py-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] shadow-lg">
        <div className="hidden items-center justify-around max-[420px]:flex">
          {visibleLinks.map((link) => (
            <div key={`compact-${link.label}`} className="flex-1">
              {renderNavLink(link, true)}
            </div>
          ))}

          {hasOverflow && (
            <button
              type="button"
              onClick={() => setShowMore((prev) => !prev)}
              className="flex flex-1 min-w-0 flex-col items-center px-1 py-1 text-[10px] leading-tight text-muted-foreground transition-colors hover:text-primary"
              aria-expanded={showMore}
              aria-label="Toggle more navigation"
            >
              <span className="mb-1 text-base">⋯</span>
              <span className="truncate">More</span>
            </button>
          )}
        </div>

        <div className="flex items-center justify-around max-[420px]:hidden">
          {links.map((link) => renderNavLink(link))}
        </div>
      </nav>
    </>
  );
}