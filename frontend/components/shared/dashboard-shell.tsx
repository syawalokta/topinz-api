"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, Settings, User as UserIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Match only the exact path (for overview pages). */
  exact?: boolean;
}

interface DashboardShellProps {
  nav: NavItem[];
  /** Small label above the nav, e.g. "User" / "Admin". */
  sectionLabel?: string;
  children: React.ReactNode;
}

function roleBadgeVariant(role?: string) {
  if (role === "admin") return "info" as const;
  if (role === "premium") return "success" as const;
  return "secondary" as const;
}

function NavLinks({
  nav,
  onNavigate,
}: {
  nav: NavItem[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5">
      {nav.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
              active
                ? "bg-accent font-medium text-foreground"
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBody({
  nav,
  sectionLabel,
  onNavigate,
}: {
  nav: NavItem[];
  sectionLabel?: string;
  onNavigate?: () => void;
}) {
  const { user } = useAuth();
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center px-4">
        <Logo href="/" />
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3 scrollbar-thin">
        {sectionLabel ? (
          <p className="mb-2 px-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
            {sectionLabel}
          </p>
        ) : null}
        <NavLinks nav={nav} onNavigate={onNavigate} />
      </div>
      <div className="border-t p-3">
        {user ? (
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
            <Avatar className="h-7 w-7">
              <AvatarFallback>
                {user.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium leading-tight">
                {user.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                @{user.username}
              </p>
            </div>
            <Badge variant={roleBadgeVariant(user.role)} className="capitalize">
              {user.role}
            </Badge>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <Skeleton className="h-7 w-7 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function DashboardShell({
  nav,
  sectionLabel,
  children,
}: DashboardShellProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-muted/30 dark:bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r bg-background lg:block">
        <SidebarBody nav={nav} sectionLabel={sectionLabel} />
      </aside>

      <div className="lg:pl-60">
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur sm:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Buka menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="sr-only">Menu navigasi</SheetTitle>
              <SidebarBody
                nav={nav}
                sectionLabel={sectionLabel}
                onNavigate={() => setMobileOpen(false)}
              />
            </SheetContent>
          </Sheet>

          <div className="ml-auto flex items-center gap-1.5">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden text-muted-foreground sm:inline-flex"
            >
              <Link href="/docs">Documentation</Link>
            </Button>
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="rounded-full outline-none ring-ring focus-visible:ring-2"
                  aria-label="Menu akun"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {(user?.username ?? "??").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user?.email}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user?.role === "admin" ? (
                  <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                    <UserIcon />
                    Dashboard User
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem
                  onClick={() =>
                    router.push(
                      user?.role === "admin"
                        ? "/admin/settings"
                        : "/dashboard/settings"
                    )
                  }
                >
                  <Settings />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="text-red-600 focus:text-red-600 dark:text-red-400"
                >
                  <LogOut />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export { Separator as DashboardSeparator };
