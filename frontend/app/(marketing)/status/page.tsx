"use client";

import { RefreshCw } from "lucide-react";
import { useApi } from "@/lib/hooks";
import type { StatusData, StatusDay } from "@/lib/types";
import { formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";

const dayFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
});

const dayStyles: Record<StatusDay["status"], { bar: string; label: string }> =
  {
    ok: { bar: "bg-emerald-500/80", label: "Operational" },
    degraded: { bar: "bg-amber-500", label: "Degraded" },
    down: { bar: "bg-red-500", label: "Down" },
  };

type OverallState = "operational" | "partial" | "major";

const overallStyles: Record<
  OverallState,
  { dot: string; ping: string; label: string }
> = {
  operational: {
    dot: "bg-emerald-500",
    ping: "bg-emerald-400",
    label: "All Systems Operational",
  },
  partial: {
    dot: "bg-amber-500",
    ping: "bg-amber-400",
    label: "Partial Outage",
  },
  major: {
    dot: "bg-red-500",
    ping: "bg-red-400",
    label: "Major Outage",
  },
};

function StatusSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-28 w-full rounded-xl" />
      <div className="divide-y rounded-xl border">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    </div>
  );
}

export default function StatusPage() {
  const { data, error, loading, refetch } =
    useApi<StatusData>("/status/public");

  const overall: OverallState = !data
    ? "operational"
    : data.operational
      ? "operational"
      : data.services.some((service) => service.operational)
        ? "partial"
        : "major";
  const tone = overallStyles[overall];

  return (
    <div className="container py-16 md:py-20">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight">Status</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ketersediaan layanan Topinz API selama 90 hari terakhir.
        </p>

        <div className="mt-10">
          {loading ? (
            <StatusSkeleton />
          ) : !data ? (
            <EmptyState
              title="Status backend tidak dapat dihubungi"
              description={
                error ?? "Terjadi kesalahan saat memuat status layanan."
              }
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void refetch()}
                >
                  <RefreshCw />
                  Coba lagi
                </Button>
              }
            />
          ) : (
            <div className="space-y-10">
              <div className="flex flex-col gap-6 rounded-xl border bg-card p-6 shadow-soft sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span
                      className={cn(
                        "absolute inline-flex h-full w-full animate-ping rounded-full opacity-50",
                        tone.ping
                      )}
                    />
                    <span
                      className={cn(
                        "relative inline-flex h-3 w-3 rounded-full",
                        tone.dot
                      )}
                    />
                  </span>
                  <p className="text-lg font-semibold tracking-tight">
                    {tone.label}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-6 sm:text-right">
                  <div>
                    <p className="text-sm font-semibold tabular-nums">
                      {data.uptimePercent.toFixed(2)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Uptime</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold tabular-nums">
                      {Math.round(data.avgResponseMs)} ms
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Avg response
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold tabular-nums">
                      {formatNumber(data.totalEndpoints)}
                    </p>
                    <p className="text-xs text-muted-foreground">Endpoint</p>
                  </div>
                </div>
              </div>

              <div className="divide-y rounded-xl border bg-card shadow-soft">
                {data.services.map((service) => (
                  <div key={service.name} className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full",
                            service.operational
                              ? "bg-emerald-500"
                              : "bg-amber-500"
                          )}
                        />
                        <p className="text-sm font-medium">{service.name}</p>
                      </div>
                      <p className="text-sm tabular-nums text-muted-foreground">
                        {service.uptimePercent.toFixed(2)}%
                      </p>
                    </div>
                    <div className="mt-3 flex h-8 gap-px">
                      {service.days.map((day) => (
                        <div
                          key={day.date}
                          title={`${dayFormatter.format(new Date(day.date))} — ${dayStyles[day.status].label}`}
                          className={cn(
                            "flex-1 rounded-[2px]",
                            dayStyles[day.status].bar
                          )}
                        />
                      ))}
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>90 hari lalu</span>
                      <span>Hari ini</span>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <h2 className="text-base font-semibold tracking-tight">
                  Riwayat Insiden
                </h2>
                <div className="mt-4">
                  {data.incidents.length === 0 ? (
                    <EmptyState
                      title="Tidak ada insiden dalam 90 hari terakhir"
                      description="Seluruh layanan berjalan normal."
                    />
                  ) : (
                    <div className="space-y-3">
                      {data.incidents.map((incident) => (
                        <div
                          key={`${incident.date}-${incident.title}`}
                          className="rounded-xl border bg-card p-5 shadow-soft"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-medium">
                              {incident.title}
                            </p>
                            {incident.resolved ? (
                              <Badge variant="success">Resolved</Badge>
                            ) : (
                              <Badge variant="warning">Investigating</Badge>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {formatDate(incident.date)}
                          </p>
                          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            {incident.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <p className="mt-12 text-center text-xs text-muted-foreground">
          Status diperbarui otomatis dari request logs.
        </p>
      </div>
    </div>
  );
}
