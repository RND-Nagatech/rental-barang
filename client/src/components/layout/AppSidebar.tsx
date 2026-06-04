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

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

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
            AD
          </div>
          <div className="grid group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-medium leading-none">Admin Operasional</span>
            <span className="text-xs text-sidebar-foreground/60">admin@rentory.id</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
