"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useApi } from "@/lib/hooks";
import type { PricingPlan } from "@/lib/types";
import { formatIDR, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

/** Used while loading and whenever the backend is unreachable. */
const fallbackPlans: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "selamanya",
    description: "Untuk eksplorasi dan proyek personal.",
    dailyLimit: 30,
    features: [
      "Akses seluruh endpoint gratis",
      "1 API key per akun",
      "Dokumentasi lengkap",
      "Statistik penggunaan di dashboard",
      "Support komunitas",
    ],
    highlighted: false,
  },
  {
    id: "premium",
    name: "Premium",
    price: 49000,
    period: "per bulan",
    description: "Untuk aplikasi production dengan trafik nyata.",
    dailyLimit: 5000,
    features: [
      "Semua fitur paket Free",
      "Akses endpoint premium",
      "Whitelist IP",
      "Rate limit lebih tinggi",
      "Support prioritas 24/7",
    ],
    highlighted: true,
  },
];

export function PricingCards({ className }: { className?: string }) {
  const { data, loading } = useApi<{ plans: PricingPlan[] }>("/pricing");

  if (loading) {
    return (
      <div className={cn("grid gap-6 md:grid-cols-2", className)}>
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="rounded-xl border bg-card p-6 sm:p-8">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="mt-3 h-4 w-3/4" />
            <Skeleton className="mt-6 h-9 w-40" />
            <Skeleton className="mt-2 h-4 w-32" />
            <div className="mt-8 space-y-3">
              {Array.from({ length: 5 }).map((_, row) => (
                <Skeleton key={row} className="h-4 w-full" />
              ))}
            </div>
            <Skeleton className="mt-8 h-9 w-full rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  const plans =
    data && data.plans.length > 0 ? data.plans : fallbackPlans;

  return (
    <div className={cn("grid gap-6 md:grid-cols-2", className)}>
      {plans.map((plan) => (
        <div
          key={plan.id}
          className={cn(
            "flex flex-col rounded-xl border bg-card p-6 shadow-soft sm:p-8",
            plan.highlighted && "border-primary/50 ring-1 ring-primary"
          )}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">{plan.name}</h3>
            {plan.highlighted ? (
              <span className="text-xs font-medium text-primary">
                Recommended
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {plan.description}
          </p>
          <div className="mt-6 flex items-baseline gap-1.5">
            <span className="text-3xl font-semibold tracking-tight tabular-nums">
              {formatIDR(plan.price)}
            </span>
            <span className="text-sm text-muted-foreground">
              {plan.period}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {formatNumber(plan.dailyLimit)} request per hari
          </p>
          <Separator className="my-6" />
          <ul className="flex-1 space-y-2.5">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <Button
            asChild
            className="mt-8 w-full"
            variant={plan.highlighted ? "default" : "outline"}
          >
            <Link href="/register">
              {plan.highlighted ? "Upgrade ke Premium" : "Mulai Gratis"}
            </Link>
          </Button>
        </div>
      ))}
    </div>
  );
}
