"use client";

import { SuperAdminSidebar } from "@/features/super-admin/components/SuperAdminSidebar";
import { MobileBottomNav } from "@/components/organization/nav-bar/mobile-bottom-nav";
import { LayoutDashboard, Building2, Users } from "lucide-react";

// Icon keys must match the `icon` field in mobileNavLinks
const mobileIconMap = {
  "layout-dashboard": LayoutDashboard,
  "building-2": Building2,
  "users": Users,
};

const mobileNavLinks = [
  { label: "Dashboard", href: "/super-admin/dashboard", icon: "layout-dashboard" },
  { label: "Organizations", href: "/super-admin/organizations", icon: "building-2" },
  { label: "Accounts", href: "/super-admin/org-accounts", icon: "users" },
];

interface SuperAdminLayoutProps {
  children: React.ReactNode;
  user?: { name?: string; email?: string };
}

export function SuperAdminLayout({ children, user }: SuperAdminLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-slate-50">
      <SuperAdminSidebar user={user} className="z-50" />
      <div className="flex-1 flex flex-col min-w-0">
        {/* pt-14 on md to account for the fixed top bar from SuperAdminSidebar */}
        <main className="flex-1 pt-0 xl:pt-0 md:pt-14">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-page-enter">
            {children}
          </div>
        </main>
        <MobileBottomNav
          links={mobileNavLinks}
          iconMap={mobileIconMap}
        />
      </div>
    </div>
  );
}
