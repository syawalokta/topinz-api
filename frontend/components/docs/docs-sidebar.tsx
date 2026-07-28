"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useApi } from "@/lib/hooks";
import type { DocsNavCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MethodBadge } from "@/components/shared/method-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const overviewLinks = [
  { label: "Getting Started", href: "/docs" },
  { label: "Authentication", href: "/docs/authentication" },
  { label: "Error Codes", href: "/docs/errors" },
  { label: "Rate Limit", href: "/docs/rate-limit" },
];

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
      {children}
    </p>
  );
}

const itemClass = (active: boolean) =>
  cn(
    "flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] transition-colors",
    active
      ? "bg-accent font-medium text-foreground"
      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
  );

interface DocsSidebarContentProps {
  /** Called after a link is clicked (used to close the mobile sheet). */
  onNavigate?: () => void;
}

/** Shared docs navigation — rendered in the desktop aside and mobile sheet. */
export function DocsSidebarContent({ onNavigate }: DocsSidebarContentProps) {
  const pathname = usePathname();
  const { data, error, loading, refetch } = useApi<{
    categories: DocsNavCategory[];
  }>("/docs/nav");
  const [closed, setClosed] = React.useState<ReadonlySet<string>>(new Set());

  const toggle = (slug: string) => {
    setClosed((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const categories = data?.categories ?? [];

  return (
    <nav aria-label="Navigasi dokumentasi" className="space-y-7">
      <div>
        <GroupLabel>Overview</GroupLabel>
        <ul className="mt-2 space-y-0.5">
          {overviewLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={onNavigate}
                className={itemClass(pathname === link.href)}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <GroupLabel>API Reference</GroupLabel>
        <div className="mt-2">
          {loading ? (
            <div className="space-y-5 px-2 py-1">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-4/5" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="space-y-2 px-2 py-1">
              <p className="text-xs text-muted-foreground">
                Gagal memuat navigasi
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void refetch()}
              >
                Coba lagi
              </Button>
            </div>
          ) : categories.length === 0 ? (
            <p className="px-2 py-1 text-xs text-muted-foreground">
              Belum ada endpoint yang dipublikasikan.
            </p>
          ) : (
            <div className="space-y-1">
              {categories.map((category) => {
                const isOpen = !closed.has(category.slug);
                return (
                  <div key={category.slug}>
                    <button
                      type="button"
                      onClick={() => toggle(category.slug)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-[13px] font-medium text-foreground transition-colors hover:bg-accent/50"
                    >
                      <span className="truncate">{category.name}</span>
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
                          !isOpen && "-rotate-90"
                        )}
                      />
                    </button>
                    {isOpen ? (
                      <ul className="mt-0.5 space-y-0.5 pb-1.5">
                        {category.endpoints.map((endpoint) => {
                          const href = `/docs/${endpoint.slug}`;
                          return (
                            <li key={endpoint.slug}>
                              <Link
                                href={href}
                                onClick={onNavigate}
                                className={itemClass(pathname === href)}
                              >
                                <MethodBadge
                                  method={endpoint.method}
                                  className="w-[44px] shrink-0 justify-center"
                                />
                                <span className="truncate">
                                  {endpoint.name}
                                </span>
                                {endpoint.premiumOnly ? (
                                  <span className="ml-auto shrink-0 text-[10px] font-medium text-primary">
                                    Pro
                                  </span>
                                ) : null}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

/** Desktop docs sidebar (the shared content, no extra chrome). */
export function DocsSidebar() {
  return <DocsSidebarContent />;
}
