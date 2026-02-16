"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Moon, Sun, Settings, LogOut, User } from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "../ui/sidebar";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase/firebase.config";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { cacheUtils } from "@/utils/cacheUtils";

// Define the User interface
interface User {
  name?: string;
  email?: string;
  avatar?: string;
  image?: string;
}

// Define the props interface
interface SiteHeaderProps {
  user?: User | null;
  isAuthenticated: boolean;
  showSidebarTrigger?: boolean; // Prop to control sidebar trigger visibility
}

export function SiteHeader({
  user,
  isAuthenticated,
  showSidebarTrigger = false,
}: SiteHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Use avatar from user.avatar or user.image (fallback) if user exists
  const avatarSrc = user?.avatar || user?.image;
  const isLoginPage = pathname === "/login";
  const isOrgPage =
    pathname.startsWith("/org-") || pathname.startsWith("/organization/");

  // Ensure component is mounted before showing theme-dependent content
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);

      // Set global signing out state first
      cacheUtils.setSigningOut(true);

      // Use centralized cache clearing utility
      cacheUtils.clearOnLogout();

      // First, sign out from Firebase
      await signOut(auth);

      // Then clear the session cookie via the API
      const response = await fetch("/api/auth/signout", {
        method: "POST",
        credentials: "include", // Important: Include credentials to manage cookies
      });

      if (!response.ok) {
        console.warn(
          "API signout encountered an issue, continuing logout process"
        );
      }

      // Use a reload approach for a clean slate
      window.location.href = "/?logout=true";
    } catch (error) {
      console.error("Error signing out:", error);

      // Even if there's an error with signOut, still try to clear caches
      cacheUtils.clearOnLogout();

      // And still redirect to the login page
      window.location.href = "/?logout=true";
    }
  };

  return (
    <header className="w-full h-[69px] bg-white dark:bg-background border-b border-gray-400 dark:border-border shadow-lg relative z-10">
      {isLoggingOut && (
        <LoadingScreen message="Signing out..." className="rounded-none" />
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between w-full h-full">
          {/* Left side - Logo, Title, and Sidebar Trigger */}
          <div className="flex items-center">
            {/* Sidebar Trigger - Show on all screen sizes for org pages */}
            {showSidebarTrigger && isOrgPage && (
              <SidebarTrigger className="mr-4 sm:hidden block" />
            )}

            {/* Mobile Logo & Title - Always show on mobile except login page */}
            <div className="flex items-center sm:hidden">
              {!isLoginPage && (
                <Image
                  src="/enhanced-logo-final.svg"
                  alt="Coral Logo"
                  width={45}
                  height={45}
                  className="text-primary"
                />
              )}
              <Link href={isAuthenticated ? "/org-dashboard" : "/"}>
                <h1 className="text-xl lg:text-2xl font-bold text-foreground dark:text-foreground ml-3">
                  CORAL
                </h1>
              </Link>
            </div>

            {/* Desktop - Either show nothing (org pages) or logo+title (public pages) */}
            <div className="hidden sm:flex items-center">
              {!isOrgPage && !isLoginPage && (
                <Link
                  href={isAuthenticated ? "/org-dashboard" : "/"}
                  className="flex items-center"
                >
                  <Image
                    src="/enhanced-logo-final.svg"
                    alt="Coral Logo"
                    width={40}
                    height={40}
                    className="text-primary mr-2"
                  />
                  <h1 className="text-xl font-bold text-foreground dark:text-foreground">
                    CORAL
                  </h1>
                </Link>
              )}
            </div>
          </div>

          {/* Right Navigation */}
          <div className="flex items-center justify-end space-x-4 sm:space-x-6">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="font-nunito text-lg sm:text-xl text-[#202020] dark:text-foreground hover:text-[#008ACF] dark:hover:text-primary transition-colors flex items-center gap-1"
              aria-label={
                mounted
                  ? theme === "dark"
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                  : "Toggle theme"
              }
            >
              {mounted ? (
                <>
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                  {theme === "dark" ? "Light" : "Dark"}
                </>
              ) : (
                // Show a neutral state during SSR/before hydration
                <>
                  <Moon className="h-4 w-4" />
                  Theme
                </>
              )}
            </button>

            {/* User Menu or Login Link */}
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="outline-none focus:ring-2 focus:ring-primary/20 rounded-lg">
                    <Avatar className="h-9 w-9 rounded-lg ring-1 ring-primary/20 cursor-pointer">
                      <AvatarImage src={avatarSrc} alt={user.name} />
                      <AvatarFallback className="rounded-lg bg-primary-foreground text-primary">
                        {user.name?.[0]?.toUpperCase() ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-medium">{user.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => router.push("/organization/profile")}
                    className="cursor-pointer"
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push("/organization/settings")}
                    className="cursor-pointer"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600 cursor-pointer hover:text-red-700 dark:text-red-500 dark:hover:text-red-400"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              // Show login link with consistent styling
              <Link
                href="/login"
                className={`font-nunito text-lg sm:text-xl text-[#202020] dark:text-foreground hover:text-[#008ACF] dark:hover:text-primary transition-colors ${
                  pathname === "/login" ? "font-medium" : ""
                }`}
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
