"use client";
import { AdminSidebar } from "@/components/organization/nav-bar/AdminSidebar";
import { MobileBottomNav } from "@/components/organization/nav-bar/mobile-bottom-nav";
import { PeriodSelector } from "@/features/organization/term/components/TermSelector";
import {
  LayoutDashboard,
  Calendar,
  Users,
  BarChart,
  Settings,
  LogOut,
  AlertTriangle,
  Banknote,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { cacheUtils } from "@/utils/cacheUtils";

// Define icon map for the sidebar
const iconMap = {
  "layout-dashboard": LayoutDashboard,
  calendar: Calendar,
  users: Users,
  alert: AlertTriangle,
  "bar-chart": BarChart,
  settings: Settings,
  fee: Banknote,
  clearance: ShieldCheck,
  payments: CreditCard
};

// Define mobile icon map
const mobileIconMap = {
  dashboard: LayoutDashboard,
  calendar: Calendar,
  users: Users,
  logout: LogOut,
  fee: Banknote,
  clearance: ShieldCheck,
  alert: AlertTriangle,
  payments: CreditCard
};

// Organization navigation data
const organizationData = {
  navMain: [
    {
      title: "Dashboard",
      url: "/org-dashboard",
      icon: "layout-dashboard",
    },
    {
      title: "Events",
      url: "/org-events",
      icon: "calendar",
    },
    {
      title: "Members",
      url: "/org-members",
      icon: "users",
    },
    {
      title: "Fees",
      url: "/org-fees",
      icon: "fee"
    },
    {
      title: "Fines",
      url: "/org-fines",
      icon: "alert",
    },
    {
      title: "Payments",
      url: "/org-payments",
      icon: "payments",
    },
    {
      title: "Clearance",
      url: "/org-clearance",
      icon: "clearance"
    },
    // {
    //   title: "Reports",
    //   url: "/organization/reports",
    //   icon: "bar-chart",
    // },
    // {
    //   title: "Settings",
    //   url: "/organization/settings",
    //   icon: "settings",
    // },
  ],
  mobileNavLinks: [
    {
      label: "Dashboard",
      icon: "dashboard",
      href: "/org-dashboard",
    },
    {
      label: "Events",
      icon: "calendar",
      href: "/org-events",
    },
    {
      label: "Members",
      icon: "users",
      href: "/org-members",
    },
    {
      label: "Fees",
      icon: "fee",
      href: "/org-fees",
    },
    {
      label: "Fines",
      icon: "alert",
      href: "/org-fines",
    },
    {
      label: "Payments",
      icon: "payments",
      href: "/org-payments",
    },
    {
      label: "Clearance",
      icon: "clearance",
      href: "/org-clearance",
    },
  ],
};

export default function OrganizationLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Check for signing out state on mount and when auth changes
  useEffect(() => {
    const checkSigningOutState = () => {
      // Check if signing out is in progress
      const signingOut = cacheUtils.isSigningOut();
      setIsSigningOut(signingOut);
    };

    // Check initially
    checkSigningOutState();
    // Set up an interval to check regularly
    const interval = setInterval(checkSigningOutState, 200);
    return () => clearInterval(interval);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated && !isSigningOut) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router, isSigningOut]);

  // Show loading screen while authenticating or signing out
  if (loading || isSigningOut) {
    return (
      <LoadingScreen
        message={
          isSigningOut
            ? "Signing out... Please come back soon!"
            : "Loading your organization dashboard... Welcome! We're getting everything ready for you."
        }
        className="bg-primary/5"
      />
    );
  }

  // Only render layout when authenticated
  if (!isAuthenticated || !user) {
    return null; // Will redirect in useEffect
  }

  // Format user data for components
  const userData = {
    name: user.name,
    email: user.email,
    avatar: user.avatar,
  };

  return (
    <div className="flex min-h-screen w-full organization-bg">
      <AdminSidebar
        user={userData}
        className="z-50"
      />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b px-5 sm:px-6 xl:px-8 py-3 flex items-center justify-end shadow-sm">
          <div className="flex items-center gap-3 w-full">
            <div className="w-[250px] md:w-full">
              <PeriodSelector />
            </div>
          </div>
        </div>
        <main className="flex-1">
          <div className="mx-auto max-w-7xl pb-20 xl:pb-10 pt-8 px-5 sm:px-6 xl:px-8 xl:pt-10">
            {children}
          </div>
        </main>
        <MobileBottomNav
          links={organizationData.mobileNavLinks}
          iconMap={mobileIconMap}
        />
      </div>
    </div>
  );
}