"use client";

import { LayoutDashboard, Users, BarChart3, FileText, Zap, LogOut, Megaphone, AlertTriangle, BookOpen, Star, MapPin, Route } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Overview", url: "/admin", icon: LayoutDashboard },
  { title: "Leads", url: "/admin/leads", icon: Users },
  { title: "Ad Creatives", url: "/admin/ad-creatives", icon: Megaphone },
  { title: "Blogs", url: "/admin/blogs", icon: BookOpen },
  { title: "Scaling Engine", url: "/admin/scaling", icon: Zap },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "Tracking", url: "/admin/tracking", icon: Route },
  { title: "Content Studio", url: "/admin/content", icon: FileText },
  { title: "Errors", url: "/admin/lead-errors", icon: AlertTriangle },
  { title: "Testimonials", url: "/admin/testimonials", icon: Star },
  { title: "Address Tester", url: "/admin/address-tester", icon: MapPin },
];

interface AdminSidebarProps {
  user: User;
  onSignOut: () => void;
}

export function AdminSidebar({ user, onSignOut }: AdminSidebarProps) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" style={{borderRight: "1px solid #121212"}}>
      <SidebarContent>
        {!collapsed && (
          <div className="px-4 py-5 border-b border-border">
            <span className="text-primary font-bold text-lg">TBH</span>
            <span className="text-muted-foreground text-xs ml-2">Admin</span>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.url || (item.url !== "/admin" && pathname.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <div className={`w-full ${isActive ? "bg-muted" : ""}`}>
                      <Link
                        href={item.url}
                        className={`flex items-center gap-2 px-2 py-2 rounded-md hover:bg-muted/50 ${
                          isActive ? "text-primary font-medium" : ""
                        }`}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </div>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-3">
        {!collapsed && (
          <p className="text-xs text-muted-foreground truncate mb-2">{user.email}</p>
        )}
        <SidebarMenuButton onClick={onSignOut} className="text-destructive hover:bg-destructive/10 w-full">
          <LogOut className="mr-2 h-4 w-4" />
          {!collapsed && <span>Sign Out</span>}
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
