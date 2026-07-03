"use client";

import { SuperAdminSidebar } from "@/features/super-admin/components/SuperAdminSidebar";
import { MobileBottomNav } from "@/components/organization/nav-bar/mobile-bottom-nav";
import {
  LayoutDashboard,
  Building2,
  Users,
  LogOut,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { cacheUtils } from "@/utils/cacheUtils";

// Mobile icon map
const mobileIconMap = {
  "layout-dashboard": LayoutDashboard,
  "building-2": Building2,
  "users": Users,
  "logout": LogOut,
};

// Super Admin navigation data
const superAdminData = {
  mobileNavLinks: [
    {
      label: "Dashboard",
      icon: "layout-dashboard",
      href: "/super-admin/dashboard",
    },
    {
      label: "Organizations",
      icon: "building-2",
      href: "/super-admin/organizations",
    },
    {
      label: "Accounts",
      icon: "users",
      href: "/super-admin/org-accounts",
    },
    {
      label: "Logout",
      icon: "logout",
      href: "/",
      action: "signout",
    },
  ],
};

export default function SuperAdminLayout({
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
      const signingOut = cacheUtils.isSigningOut();
      setIsSigningOut(signingOut);
    };

    checkSigningOutState();
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
            : "Loading Super Admin Dashboard... Welcome! Getting things ready for you."
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
    <div className="flex min-h-screen w-full bg-slate-50 text-slate-800">
      <SuperAdminSidebar
        user={userData}
        className="z-50"
      />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 md:mt-14 xl:mt-0">
          <div className="mx-auto max-w-7xl pb-20 xl:pb-10 pt-8 px-5 sm:px-6 xl:px-8 xl:pt-10 animate-page-enter">
            {children}
          </div>
        </main>
        <MobileBottomNav
          links={superAdminData.mobileNavLinks}
          iconMap={mobileIconMap}
        />
      </div>
    </div>
  );
}
