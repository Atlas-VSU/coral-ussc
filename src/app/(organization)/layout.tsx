"use client";
import { AppSidebar } from "@/components/NavBar/app-sidebar";
import { SiteHeader } from "@/components/NavBar/site-header";
import { MobileBottomNav } from "@/components/NavBar/mobile-bottom-nav";
import {
  LayoutDashboard,
  Calendar,
  Users,
  BarChart,
  Settings,
  LogOut,
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
  "bar-chart": BarChart,
  settings: Settings,
};

// Define mobile icon map
const mobileIconMap = {
  dashboard: LayoutDashboard,
  calendar: Calendar,
  users: Users,
  logout: LogOut,
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
    }
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
            ? "Signing out... Please come back soon! Your coral will miss you."
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
    <div className="flex min-h-screen w-full">
      <AppSidebar
        user={userData}
        navMain={organizationData.navMain}
        iconMap={iconMap}
        className="z-50"
      />
      <div className="flex-1 flex flex-col min-w-0">
        <SiteHeader
          user={userData}
          isAuthenticated={isAuthenticated}
          showSidebarTrigger={true}
        />
        <main className="flex-1 p-4 pb-16 md:pb-4">{children}</main>
        <MobileBottomNav
          links={organizationData.mobileNavLinks}
          iconMap={mobileIconMap}
        />
      </div>
    </div>
  );
}
