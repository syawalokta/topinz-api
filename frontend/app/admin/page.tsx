"use client";

import {
  Activity,
  BarChart3,
  CalendarDays,
  Crown,
  Route,
  Tags,
  User as UserIcon,
  Users,
} from "lucide-react";
import { useApi } from "@/lib/hooks";
import { formatNumber, timeAgo } from "@/lib/format";
import type { AdminStats, RequestLog } from "@/lib/types";
import { AreaChart } from "@/components/shared/area-chart";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusCodeBadge } from "@/components/shared/method-badge";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function logUsername(log: RequestLog): string | null {
  if (log.user && typeof log.user === "object") return log.user.username;
  return null;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="shadow-soft">
            <CardContent className="p-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-7 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-44" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[180px] w-full rounded-lg" />
        </CardContent>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-36" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} className="h-5 w-full" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data, error, loading, refetch } = useApi<AdminStats>("/admin/stats");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Ringkasan platform Topinz API."
      />

      {loading ? (
        <DashboardSkeleton />
      ) : error || !data ? (
        <EmptyState
          title="Gagal memuat statistik"
          description={error ?? "Terjadi kesalahan saat memuat data."}
          action={
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Coba lagi
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Today Request"
              value={formatNumber(data.todayRequest)}
              icon={Activity}
            />
            <StatCard
              label="Request Bulan Ini"
              value={formatNumber(data.monthRequest)}
              icon={CalendarDays}
            />
            <StatCard
              label="Total Request"
              value={formatNumber(data.totalRequest)}
              icon={BarChart3}
            />
            <StatCard
              label="Total User"
              value={formatNumber(data.totalUser)}
              icon={Users}
            />
            <StatCard
              label="Premium User"
              value={formatNumber(data.premiumUser)}
              icon={Crown}
            />
            <StatCard
              label="Free User"
              value={formatNumber(data.freeUser)}
              icon={UserIcon}
            />
            <StatCard
              label="Total Endpoint"
              value={formatNumber(data.totalEndpoint)}
              icon={Route}
            />
            <StatCard
              label="Kategori"
              value={formatNumber(data.totalCategory)}
              icon={Tags}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Request 30 Hari Terakhir
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AreaChart data={data.requestsPerDay} />
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Endpoints</CardTitle>
              </CardHeader>
              <CardContent>
                {data.topEndpoints.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Belum ada data
                  </p>
                ) : (
                  <div className="space-y-4">
                    {data.topEndpoints.slice(0, 5).map((item) => {
                      const max = Math.max(
                        ...data.topEndpoints.map((t) => t.count),
                        1
                      );
                      return (
                        <div key={item.endpoint}>
                          <div className="flex items-center justify-between gap-3">
                            <span className="truncate font-mono text-[13px]">
                              {item.endpoint}
                            </span>
                            <span className="shrink-0 text-[13px] font-medium tabular-nums text-muted-foreground">
                              {formatNumber(item.count)}
                            </span>
                          </div>
                          <div className="mt-1.5 h-1 rounded-full bg-primary/15">
                            <div
                              className="h-1 rounded-full bg-primary"
                              style={{
                                width: `${(item.count / max) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Aktivitas Terbaru</CardTitle>
              </CardHeader>
              <CardContent>
                {data.recentLogs.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Belum ada aktivitas
                  </p>
                ) : (
                  <div className="divide-y">
                    {data.recentLogs.map((log) => {
                      const username = logUsername(log);
                      return (
                        <div
                          key={log._id}
                          className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                        >
                          <span className="w-24 shrink-0 truncate text-xs font-medium">
                            {username ? (
                              `@${username}`
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </span>
                          <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">
                            {log.endpoint}
                          </span>
                          <StatusCodeBadge code={log.statusCode} />
                          <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
                            {timeAgo(log.createdAt)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
