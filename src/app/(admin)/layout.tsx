"use client"

import { AppSidebar } from "@/components/NavBar/app-sidebar";
import { MobileBottomNav } from "@/components/NavBar/mobile-bottom-nav";
import { SiteHeader } from "@/components/NavBar/site-header";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { useAuth } from "@/hooks/useAuth";
import { cacheUtils } from "@/utils/cacheUtils";
import { Building, LayoutDashboard, LogOut, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const iconMap = {
    "layout-dashboard": LayoutDashboard,
    "building": Building,
    "users": Users,
}
const mobileIconMap = {
  dashboard: LayoutDashboard,
  building: Building,
  users: Users,
  logout: LogOut,
};

const adminData = {
  navMain: [
    {
      title: "Dashboard",
      url: "/admin-dashboard",
      icon: "layout-dashboard",
    },
    {
      title: "Orfganization",
      url: "/admin-organization",
      icon: "building",
    },
    {
      title: "Members",
      url: "/admin-students",
      icon: "users",
    },
  ],
  mobileNavLinks: [
    {
      label: "Dashboard",
      href: "/admin-dashboard",
      icon: "layout-dashboard",
    },
    {
      label: "Organization",
      href: "/admin-organization",
      icon: "building",
    },
    {
      label: "Members",
      href: "/admin-students",
      icon: "users",
    },
    {
      label: "Logout",
      href: "/logout",
      icon: "log-out",
    },
  ],
};

export default function AdminLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const { user, loading, isAuthenticated } = useAuth();
    const router = useRouter()
    const [isSigningOut, setIsSigningOut] = useState(false);
    
    useEffect(() => {
        const checkSigningOutSate = () => {
            const signingOut = cacheUtils.isSigningOut();
            setIsSigningOut(signingOut);
        }

        checkSigningOutSate();

        const interval = setInterval(checkSigningOutSate, 200);
        return () => clearInterval(interval);
    })

    useEffect(() => {
    if (!loading && !isAuthenticated && !isSigningOut) {
      router.push("/login");
    }
    }, [loading, isAuthenticated, router, isSigningOut]);

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
                navMain={adminData.navMain}
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
                    links={adminData.mobileNavLinks}
                    iconMap={mobileIconMap}
                />
            </div>
        </div>
    );
}