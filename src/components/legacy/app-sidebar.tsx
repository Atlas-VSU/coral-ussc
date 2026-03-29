import * as React from "react";
import { LayoutDashboard, List, ChartBar } from "lucide-react";
import { NavUser } from "./nav-user";
import { NavMain } from "./nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarLogo,
} from "@/components/ui/sidebar";
import Image from "next/image";
import Link from "next/link";

// Define types for the user and nav items
interface User {
  name?: string;
  email?: string;
  image?: string;
  avatar?: string; // Add avatar property
}

interface NavItem {
  title: string;
  url: string;
  icon?: string;
}

interface IconMap {
  [key: string]: React.ComponentType<{ className?: string }>;
}

interface AppSidebarProps {
  user: User;
  navMain: NavItem[];
  iconMap?: IconMap;
  className?: string; // Add className prop
}

// Default icon map if not provided
const defaultIconMap: IconMap = {
  "layout-dashboard": LayoutDashboard,
  "list-details": List,
  "chart-bar": ChartBar,
};

export function AppSidebar({
  user,
  navMain,
  iconMap = defaultIconMap,
  className,
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar
      collapsible="offcanvas"
      className={className}
      {...props}
    >
      <SidebarLogo>
        <Link href="/" className="flex items-center justify-start space-x-4 w-full py-2">
          <Image
            src="/enhanced-logo-final.svg"
            alt="CORAL Logo"
            width={48}
            height={48}
            className="text-primary flex-shrink-0"
          />
          <div className="flex flex-col">
            <span className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              CORAL
            </span>
          </div>
        </Link>
      </SidebarLogo>
      <SidebarContent>
        <NavMain items={navMain} iconMap={iconMap} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}