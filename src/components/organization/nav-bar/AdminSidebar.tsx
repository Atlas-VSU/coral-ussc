"use client"

import Image from "next/image"
import { usePathname } from "next/navigation"

import {
  LayoutDashboard,
  Users,
  Banknote,
  CalendarDays,
  AlertTriangle,
  ShieldCheck,
  Menu,
  X,
  CreditCard,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "../../ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "../../ui/sheet"
import { useState, useEffect } from "react"
import { NavContent, NavItem } from "./NavContent"
import { Organization } from "@/constants/types"

export interface User {
  name?: string;
  email?: string;
  image?: string;
  avatar?: string;
}





export function AdminSidebar({ user, className, org }: { user?: User; className?: string, org?: Organization }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  const isActiveHref = (href: string, pathname: string) =>
    href === "/org-dashboard" ? pathname === "/org-dashboard" : pathname.startsWith(href);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  const navItems: NavItem[] = [
  { label: "Dashboard", href: "/org-dashboard", icon: LayoutDashboard },
  { label: "Members",   href: "/org-members",   icon: Users },
  { label: "Events",    href: "/org-events",    icon: CalendarDays },
  { label: "Fees",      href: "/org-fees",      icon: Banknote },
  { label: "Fines",     href: "/org-fines",     icon: AlertTriangle },
  { label: "Payments",  href: "/org-payments",  icon: CreditCard },
  { label: "Clearance", href: "/org-clearance", icon: ShieldCheck },
  // { label: "Analytics", href: "/org-reports",   icon: BarChart3 },
]

  // Get current page label for mobile header
  const allItems = navItems
  const currentItem = allItems.find(i => isActiveHref(i.href, pathname))
  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden shrink-0 border-r border-[#E0E0E0] bg-white xl:flex xl:flex-col transition-[width] duration-200 ease-in-out sticky top-0 h-svh",
          collapsed ? "w-15" : "w-60",
          className
        )}
      >
        <NavContent 
          pathname={pathname} 
          collapsed={collapsed} 
          user={user} 
          isAuthenticated={!!user}
          navItems={navItems}
          organization={org}
        />


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
      <div className="hidden md:flex fixed inset-x-0 top-0 z-40 h-14 items-center gap-3 border-b border-[#E0E0E0] bg-white px-4 xl:hidden" suppressHydrationWarning>
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
                {/* <Button
                  variant="icon"
                  size="icon"
                  className="size-8 text-[#616161]"
                  onClick={() => setOpen(false)}
                >
                  <X className="size-4" />
                </Button> */}
              </div>
              <NavContent pathname={pathname} onNavigate={() => setOpen(false)} user={user} navItems={navItems} organization={org} />
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
          <img src={org?.orgLogoUrl || "/images/ussc-logo-1.webp"} alt="Org Logo" width={24} height={24} className="size-6 object-contain shrink-0" />
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-sm font-bold bg-linear-to-r from-[#1B5E20] via-[#0D3B12] to-[#0A2E0F] bg-clip-text text-transparent shrink-0">{org?.shortName}</span>
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
