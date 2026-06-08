import { useRouterState } from "@tanstack/react-router";
import { Bell, LogOut, Search } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { allNavItems } from "./nav-config";
import { adminAuth } from "@/lib/adminAuth";

export function AppHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const current =
    [...allNavItems]
      .sort((a, b) => b.url.length - a.url.length)
      .find((i) => (i.url === "/" ? pathname === "/" : pathname.startsWith(i.url)))?.title ??
    "Dashboard";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md md:px-6">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-6" />
      <h2 className="font-display text-base font-semibold">{current}</h2>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden text-right md:block">
          {/* <p className="text-sm font-semibold leading-none">{adminAuth.getUser()?.nama_user || "Admin"}</p>
          <p className="mt-1 text-xs capitalize text-muted-foreground">{adminAuth.getUser()?.role || "admin"}</p> */}
        </div>
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Cari transaksi, barang..." className="w-64 pl-9" />
        </div>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="size-4" />
          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-destructive" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          title="Logout"
          onClick={() => {
            adminAuth.clear();
            window.location.replace("/login");
          }}
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </header>
  );
}
