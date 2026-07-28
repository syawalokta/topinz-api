"use client";

import {
  BookOpen,
  History,
  KeyRound,
  LayoutDashboard,
  Settings,
  ShieldCheck,
} from "lucide-react";
import {
  DashboardShell,
  type NavItem,
} from "@/components/shared/dashboard-shell";

const nav: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard, exact: true },
  { label: "API Key", href: "/dashboard/api-key", icon: KeyRound },
  { label: "Whitelist", href: "/dashboard/whitelist", icon: ShieldCheck },
  { label: "Request History", href: "/dashboard/history", icon: History },
  { label: "Documentation", href: "/docs", icon: BookOpen },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell nav={nav} sectionLabel="User">
      {children}
    </DashboardShell>
  );
}
