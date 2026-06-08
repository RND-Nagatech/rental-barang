import { Link, useRouterState } from "@tanstack/react-router";
import { Boxes } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { navGroups } from "./nav-config";
import { adminAuth } from "@/lib/adminAuth";

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const user = adminAuth.getUser();
  const initial = (user?.nama_user || user?.email || "AD")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isActive = (url: string) => (url === "/" ? pathname === "/" : pathname.startsWith(url));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-1 py-1.5">
          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Boxes className="size-5" />
          </div>
          <div className="grid group-data-[collapsible=icon]:hidden">
            <span className="font-display text-lg font-bold leading-none tracking-tight">
              Rentory
            </span>
            <span className="text-xs text-sidebar-foreground/60">Admin Rental</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-2.5 px-1 py-1">
          <div className="grid size-8 shrink-0 place-items-center rounded-full bg-sidebar-accent text-sm font-semibold">
            {initial || "AD"}
          </div>
          <div className="grid group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-medium leading-none">{user?.nama_user || "Admin"}</span>
            <span className="text-xs text-sidebar-foreground/60">{user?.email || "-"}</span>
            <span className="text-[11px] capitalize text-sidebar-foreground/50">{user?.role || "admin"}</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
