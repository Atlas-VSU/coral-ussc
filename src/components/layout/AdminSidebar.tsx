"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Banknote,
  CalendarDays,
  AlertTriangle,
  ShieldCheck,
  BarChart3,
  LogOut,
  Menu,
  X,
  CreditCard,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "../ui/button"
import { Separator } from "../ui/separator"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "../ui/sheet"
import { Avatar, AvatarFallback } from "../ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip"
import { useState, useEffect } from "react"

interface User {
  name?: string;
  email?: string;
  image?: string;
  avatar?: string;
}

const navItems = [
  { label: "Dashboard", href: "/org-dashboard", icon: LayoutDashboard },
  { label: "Members",   href: "/org-members",   icon: Users },
  { label: "Events",    href: "/org-events",    icon: CalendarDays },
  { label: "Fees",      href: "/org-fees",      icon: Banknote },
  { label: "Fines",     href: "/org-fines",     icon: AlertTriangle },
  { label: "Payments",  href: "/org-payments",  icon: CreditCard },
  { label: "Clearance", href: "/org-clearance", icon: ShieldCheck },
  // { label: "Analytics", href: "/org-reports",   icon: BarChart3 },
]

function isActiveHref(href: string, pathname: string) {
  return href === "/org-dashboard" ? pathname === "/org-dashboard" : pathname.startsWith(href)
}

function NavContent({
  pathname,
  collapsed = false,
  onNavigate,
  user,
}: {
  pathname: string
  collapsed?: boolean
  onNavigate?: () => void
  user?: User
}) {
  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
    : "AD"
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-full flex-col overflow-hidden">
        {/* Logo */}
        <div className={cn(
          "flex items-center gap-3 px-4 py-5 shrink-0",
          collapsed && "justify-center px-0"
        )}>
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#1B5E20]/10 p-1">
            <Image src="/images/ussc-logo-1.webp" alt="USSC Logo" width={32} height={32} className="h-7 w-7 object-contain" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-none tracking-wide bg-linear-to-r from-[#1B5E20] via-[#0D3B12] to-[#0A2E0F] bg-clip-text text-transparent">USSC Connect</p>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="inline-flex items-center rounded bg-[#1B5E20]/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[#1B5E20]">
                  Admin
                </span>
              </div>
            </div>
          )}
        </div>

        <Separator className="bg-[#E0E0E0] shrink-0" />

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4" aria-label="Main navigation">
          {navItems.map((item) => {
            const active = isActiveHref(item.href, pathname)
            const linkEl = (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#1B5E20]/30",
                  collapsed && "justify-center px-0 size-10 mx-auto",
                  active
                    ? "bg-[#1B5E20] text-white shadow-sm"
                    : "text-[#616161] hover:bg-[#1B5E20]/8 hover:text-[#1B5E20]"
                )}
              >
                {active && !collapsed && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.75 rounded-full bg-[#8BC34A]" />
                )}
                <item.icon className={cn("size-4 shrink-0", active && "text-white")} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return linkEl
          })}
        </nav>

        {/* Footer */}
        <div className="shrink-0">
          <Separator className="bg-[#E0E0E0]" />
          <div className={cn(
            "flex flex-col gap-1 px-3 py-3",
            collapsed && "items-center px-0"
          )}>
            {/* User info */}
            <div className={cn(
              "flex items-center gap-2.5 rounded-md px-2 py-1.5",
              !collapsed && "hover:bg-[#F5F5F5] transition-colors"
            )}>
              <Avatar className="size-7 shrink-0 border border-[#1B5E20]/20">
                <AvatarFallback className="bg-[#1B5E20] text-xs font-semibold text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-[#212121]">{user?.name ?? "Admin User"}</p>
                  <p className="truncate text-[10px] text-[#616161]">{user?.email ?? ""}</p>
                </div>
              )}
            </div>
            {/* Sign out */}
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-9 text-[#616161] hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Sign out"
                    >
                      <LogOut className="size-4" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Sign Out</TooltipContent>
              </Tooltip>
            ) : (
              <Link href="/">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 text-[#616161] hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="size-4" />
                  Sign Out
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

export function AdminSidebar({ user, className }: { user?: User; className?: string }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  // Get current page label for mobile header
  const allItems = navItems
  const currentItem = allItems.find(i => isActiveHref(i.href, pathname))
  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden shrink-0 border-r border-[#E0E0E0] bg-white lg:flex lg:flex-col transition-[width] duration-200 ease-in-out sticky top-0 h-svh",
          collapsed ? "w-15" : "w-60",
          className
        )}
      >
        <NavContent pathname={pathname} collapsed={collapsed} user={user} />

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(v => !v)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "absolute -right-3 top-18 z-10 flex size-6 items-center justify-center rounded-full border border-[#E0E0E0] bg-white text-[#616161] shadow-sm transition-colors hover:bg-[#F5F5F5] hover:text-[#1B5E20]",
          )}
        >
          {collapsed
            ? <PanelLeftOpen className="size-3" />
            : <PanelLeftClose className="size-3" />
          }
        </button>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-[#E0E0E0] bg-white px-4 lg:hidden" suppressHydrationWarning>
        {mounted ? (
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="size-9 shrink-0">
                <Menu className="size-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-60 bg-white p-0 text-[#212121] border-r border-[#E0E0E0]">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <div className="absolute right-3 top-3 z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-[#616161] hover:bg-[#F5F5F5] hover:text-[#1B5E20]"
                  onClick={() => setOpen(false)}
                >
                  <X className="size-4" />
                </Button>
              </div>
              <NavContent pathname={pathname} onNavigate={() => setOpen(false)} user={user} />
            </SheetContent>
          </Sheet>
        ) : (
          <Button variant="ghost" size="icon" className="size-9 shrink-0" disabled aria-hidden="true">
            <Menu className="size-5" />
            <span className="sr-only">Open menu</span>
          </Button>
        )}

        {/* Logo + current page */}
        <div className="flex items-center gap-2 min-w-0">
          <Image src="/images/ussc-logo-1.webp" alt="USSC Logo" width={24} height={24} className="size-6 object-contain shrink-0" />
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-sm font-bold bg-linear-to-r from-[#1B5E20] via-[#0D3B12] to-[#0A2E0F] bg-clip-text text-transparent shrink-0">USSC</span>
            <span className="inline-flex items-center rounded bg-[#1B5E20]/10 px-1 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[#1B5E20] shrink-0">Admin</span>
            {currentItem && (
              <>
                <span className="text-muted-foreground/40 shrink-0">/</span>
                <span className="truncate text-sm text-muted-foreground">{currentItem.label}</span>
              </>
            )}
          </div>
        </div>

        {/* <div className="ml-auto">
          <ModeToggle />
        </div> */}
      </div>
    </>
  )
}
