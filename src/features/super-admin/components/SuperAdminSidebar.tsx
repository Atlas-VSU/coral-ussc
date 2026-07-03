"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase/firebase.config";
import { cacheUtils } from "@/utils/cacheUtils";
import { LoadingScreen } from "@/components/ui/loading-screen";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/super-admin/dashboard", icon: LayoutDashboard },
  { label: "Organizations", href: "/super-admin/organizations", icon: Building2 },
  { label: "Org Accounts", href: "/super-admin/org-accounts", icon: Users },
];

interface SuperAdminSidebarProps {
  user?: { name?: string; email?: string };
  className?: string;
}

function NavContent({
  pathname,
  collapsed = false,
  onNavigate,
  user,
  isLoggingOut,
  onSignOut,
}: {
  pathname: string;
  collapsed?: boolean;
  onNavigate?: () => void;
  user?: { name?: string; email?: string };
  isLoggingOut?: boolean;
  onSignOut: () => void;
}) {
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "SA";

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <TooltipProvider delayDuration={200}>
      {isLoggingOut && (
        <LoadingScreen message="Signing out..." className="rounded-none" />
      )}
      <div className="flex h-full flex-col overflow-hidden">
        {/* Logo / Brand */}
        <div
          className={cn(
            "flex items-center gap-3 px-4 py-5 shrink-0",
            collapsed && "justify-center px-0"
          )}
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 p-1.5 shadow-sm">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-none tracking-wide text-[#1565C0]">
                USSC Connect
              </p>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="inline-flex items-center rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-blue-700">
                  Super Admin
                </span>
              </div>
            </div>
          )}
        </div>

        <Separator className="bg-blue-100 shrink-0" />

        {/* Navigation */}
        <nav
          className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4"
          aria-label="Super admin navigation"
        >
          {navItems.map((item) => {
            const active = isActive(item.href);
            const linkEl = (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-300",
                  collapsed && "justify-center px-0 size-10 mx-auto",
                  active
                    ? "bg-[#1565C0] text-white shadow-sm"
                    : "text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                )}
              >
                {active && !collapsed && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.75 rounded-full bg-blue-300" />
                )}
                <item.icon
                  className={cn("size-4 shrink-0", active && "text-white")}
                />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }
            return linkEl;
          })}
        </nav>

        {/* Footer — user info + sign out */}
        <div className="shrink-0">
          <Separator className="bg-blue-100" />
          <div
            className={cn(
              "flex flex-col gap-1 px-3 py-3",
              collapsed && "items-center px-0"
            )}
          >
            {/* User info */}
            <div
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2 py-1.5",
                !collapsed && "hover:bg-blue-50 transition-colors"
              )}
            >
              <Avatar className="size-7 shrink-0 border border-blue-200">
                <AvatarFallback className="bg-blue-600 text-xs font-semibold text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-700">
                    {user?.name ?? "Super Admin"}
                  </p>
                  <p className="truncate text-[10px] text-slate-400">
                    {user?.email ?? ""}
                  </p>
                </div>
              )}
            </div>

            {/* Sign out */}
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onSignOut}
                    className="size-9 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Sign out"
                  >
                    <LogOut className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Sign Out</TooltipContent>
              </Tooltip>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSignOut}
                className="w-full justify-start gap-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
              >
                <LogOut className="size-4" />
                Sign Out
              </Button>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

export function SuperAdminSidebar({ user, className }: SuperAdminSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    try {
      setIsLoggingOut(true);
      cacheUtils.setSigningOut(true);
      cacheUtils.clearOnLogout();
      await Promise.allSettled([
        signOut(auth),
        fetch("/api/auth/signout", { method: "POST", credentials: "include" }),
      ]);
      window.location.href = "/?logout=true";
    } catch {
      cacheUtils.clearOnLogout();
      window.location.href = "/?logout=true";
    }
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden shrink-0 border-r border-blue-100 bg-white xl:flex xl:flex-col transition-[width] duration-200 ease-in-out sticky top-0 h-svh",
          collapsed ? "w-15" : "w-64",
          className
        )}
      >
        <NavContent
          pathname={pathname}
          collapsed={collapsed}
          user={user}
          isLoggingOut={isLoggingOut}
          onSignOut={handleSignOut}
        />

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3 top-18 z-10 flex size-6 items-center justify-center rounded-full border border-blue-100 bg-white text-slate-400 shadow-sm transition-colors hover:bg-blue-50 hover:text-blue-600"
        >
          {collapsed ? (
            <PanelLeftOpen className="size-3" />
          ) : (
            <PanelLeftClose className="size-3" />
          )}
        </button>
      </aside>

      {/* Tablet top bar with sheet nav */}
      <div
        className="hidden md:flex fixed inset-x-0 top-0 z-40 h-14 items-center gap-3 border-b border-blue-100 bg-white px-4 xl:hidden"
        suppressHydrationWarning
      >
        {mounted ? (
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="size-9 shrink-0">
                <Menu className="size-5 text-blue-700" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-64 bg-white p-0 text-slate-700 border-r border-blue-100"
            >
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <NavContent
                pathname={pathname}
                onNavigate={() => setOpen(false)}
                user={user}
                isLoggingOut={isLoggingOut}
                onSignOut={handleSignOut}
              />
            </SheetContent>
          </Sheet>
        ) : (
          <Button variant="ghost" size="icon" className="size-9 shrink-0" disabled>
            <Menu className="size-5" />
          </Button>
        )}

        {/* Brand in top bar */}
        <div className="flex items-center gap-2 min-w-0">
          <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0" />
          <span className="text-sm font-bold text-[#1565C0] shrink-0">
            USSC Connect
          </span>
          <span className="inline-flex items-center rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-blue-700 shrink-0">
            Super Admin
          </span>
        </div>
      </div>
    </>
  );
}
