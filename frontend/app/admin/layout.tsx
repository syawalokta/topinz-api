"use client";

import {
  CreditCard,
  LayoutDashboard,
  Route,
  ScrollText,
  Settings,
  Tags,
  Users,
} from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/shared/dashboard-shell";

const nav: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Kategori", href: "/admin/categories", icon: Tags },
  { label: "Endpoint", href: "/admin/endpoints", icon: Route },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Request Logs", href: "/admin/logs", icon: ScrollText },
  { label: "Pricing", href: "/admin/pricing", icon: CreditCard },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell nav={nav} sectionLabel="Admin">
      {children}
    </DashboardShell>
  );
}
