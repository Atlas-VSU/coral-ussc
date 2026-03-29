"use client";

import Link from "next/link";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { ComponentType } from "react";

interface NavItem {
  title: string;
  url: string;
  icon?: string;
}

interface IconMap {
  [key: string]: ComponentType<{ className?: string }>;
}

interface NavMainProps {
  items: NavItem[];
  iconMap: IconMap;
}

export function NavMain({ items, iconMap }: NavMainProps) {
  const { isMobile, setOpenMobile } = useSidebar();

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const Icon =
              item.icon && iconMap[item.icon] ? iconMap[item.icon] : null;
            return (
              <SidebarMenuItem key={item.title}>
                <Link href={item.url} className="w-full" onClick={handleNavClick}>
                  <SidebarMenuButton tooltip={item.title}>
                    {Icon && <Icon className="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
