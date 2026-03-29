"use client";

import { MoreVertical, LogOut } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase/firebase.config";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { cacheUtils } from "@/utils/cacheUtils";

interface User {
  name?: string;
  email?: string;
  avatar?: string;
  image?: string;
}

interface NavUserProps {
  user: User;
}

export function NavUser({ user }: NavUserProps) {
  const { isMobile, setOpenMobile } = useSidebar();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);

      if (isMobile) {
        setOpenMobile(false);
      }

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

      // Even if the signout fails, still clear caches
      cacheUtils.clearOnLogout();

      // And redirect to home
      window.location.href = "/?logout=true";
    }
  };

  // Use avatar from user.avatar or user.image (fallback)
  const avatarSrc = user.avatar || user.image;

  return (
    <SidebarMenu>
      {isSigningOut && <LoadingScreen message="Signing out..." />}
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 data-[state=open]:bg-gray-100 dark:data-[state=open]:bg-gray-700"
            >
              <Avatar className="h-9 w-9 rounded-lg">
                <AvatarImage src={avatarSrc} alt={user.name} />
                <AvatarFallback className="rounded-lg">
                  {user.name?.[0]?.toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-base leading-tight">
                <span className="truncate font-semibold text-gray-900 dark:text-white">
                  {user.name}
                </span>
                <span className="truncate text-sm text-gray-500 dark:text-gray-400">
                  {user.email}
                </span>
              </div>
              <MoreVertical className="ml-auto size-5 text-gray-500 dark:text-gray-400" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-3 px-3 py-3 text-left text-base">
                <Avatar className="h-9 w-9 rounded-lg">
                  <AvatarImage src={avatarSrc} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {user.name?.[0]?.toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-base leading-tight">
                  <span className="truncate font-semibold text-gray-900 dark:text-white">
                    {user.name}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 truncate text-sm">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex gap-3 py-2.5 px-3 text-base text-destructive cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/20"
              onClick={handleSignOut}
            >
              <LogOut className="size-5" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
