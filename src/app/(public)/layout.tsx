"use client";
import { SiteHeader } from "@/components/NavBar/site-header";
import { MobileBottomNav } from "@/components/NavBar/mobile-bottom-nav";
import { Home as HomeIcon, Info, LogIn, LayoutDashboard } from "lucide-react";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase/firebase.config";
import { usePathname, useRouter } from "next/navigation";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { cacheUtils } from "@/utils/cacheUtils";

// Define mobile icon map
const mobileIconMap = {
  home: HomeIcon,
  login: LogIn,
  info: Info,
  dashboard: LayoutDashboard,
};

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Check for logout URL parameter on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("logout") === "true") {
        // Clear the signing out flag on arrival at home with logout=true
        cacheUtils.setSigningOut(false);

        // Remove the parameter without causing a refresh
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, []);

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

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const authenticated = !!user;
      setIsAuthenticated(authenticated);

      // If user is authenticated and trying to access the home page or login page,
      // redirect them to dashboard (but not if they're signing out)
      if (
        authenticated &&
        !isSigningOut &&
        (pathname === "/" || pathname === "/login")
      ) {
        setIsRedirecting(true);
        router.push("/org-dashboard");
      } else {
        setLoading(false);
      }
    });

    // Clean up subscription
    return () => unsubscribe();
  }, [pathname, router, isSigningOut]);

  // Dynamic navigation links based on authentication status
  const navLinks = [
    {
      label: "Home",
      icon: "home",
      href: isAuthenticated ? "/org-dashboard" : "/",
    },
    {
      label: "About",
      icon: "info",
      href: "/coming-soon",
    },
    {
      label: isAuthenticated ? "Dashboard" : "Login",
      icon: isAuthenticated ? "dashboard" : "login",
      href: isAuthenticated ? "/org-dashboard" : "/login",
    },
  ];

  // Show loading screen during signing out
  if (isSigningOut) {
    return (
      <LoadingScreen message="Signing out... Packing your digital bags and waving goodbye! 👋" />
    );
  }

  // Always show loading screen while loading
  if (loading) {
    return <LoadingScreen message="Getting things ready..." />;
  }

  if (isRedirecting) {
    return <LoadingScreen message="Redirecting to dashboard..." />;
  }

  // Only render children when not loading
  return (
    <div className="flex min-h-screen w-full">
      <div className="flex-1 flex flex-col min-w-0">
        <SiteHeader user={null} isAuthenticated={isAuthenticated} />
        <main className="flex-1 p-2 sm:p-4 pb-16 md:pb-4">{children}</main>
        <MobileBottomNav links={navLinks} iconMap={mobileIconMap} />
      </div>
    </div>
  );
}
