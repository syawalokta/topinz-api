"use client";

import Link from "next/link";
import { Activity, BarChart3, Gauge, UserRound } from "lucide-react";
import { useApi } from "@/lib/hooks";
import { formatDate, formatNumber, maskApiKey, timeAgo } from "@/lib/format";
import type { UserDashboard } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { AreaChart } from "@/components/shared/area-chart";
import { CopyButton } from "@/components/shared/copy-button";
import { EmptyState } from "@/components/shared/empty-state";
import { MethodBadge, StatusCodeBadge } from "@/components/shared/method-badge";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[110px] rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[150px] rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-[280px] rounded-xl" />
      <Skeleton className="h-[300px] rounded-xl" />
    </div>
  );
}

export default function DashboardOverviewPage() {
  const { data, error, loading, refetch } = useApi<UserDashboard>("/dashboard");

  const premiumExpired =
    data?.premiumExpiresAt != null &&
    new Date(data.premiumExpiresAt).getTime() < Date.now();

  const usagePct =
    data && data.limit > 0
      ? Math.min(100, Math.round((data.usedToday / data.limit) * 100))
      : 0;

  const roleHint = (d: UserDashboard): React.ReactNode => {
    if (d.role === "premium") {
      if (premiumExpired) return "Premium kadaluarsa";
      return d.premiumExpiresAt
        ? `Berlaku sampai ${formatDate(d.premiumExpiresAt)}`
        : "Premium aktif";
    }
    if (d.role === "free") {
      return (
        <Link
          href="/pricing"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Upgrade ke Premium
        </Link>
      );
    }
    return "Akses penuh";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description="Ringkasan penggunaan API kamu."
      />

      {loading ? (
        <OverviewSkeleton />
      ) : error || !data ? (
        <EmptyState
          title="Gagal memuat dashboard"
          description={error ?? "Terjadi kesalahan saat mengambil data."}
          action={
            <Button variant="outline" onClick={() => void refetch()}>
              Coba lagi
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Role"
              icon={UserRound}
              value={<span className="capitalize">{data.role}</span>}
              hint={roleHint(data)}
            />
            <StatCard
              label="Limit Hari Ini"
              icon={Gauge}
              value={`${formatNumber(data.usedToday)}/${formatNumber(data.limit)}`}
              hint={
                <span className="block">
                  <span className="mb-1.5 mt-0.5 block h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full bg-primary transition-all"
                      style={{ width: `${usagePct}%` }}
                    />
                  </span>
                  {formatNumber(data.remainingToday)} tersisa
                </span>
              }
            />
            <StatCard
              label="Today Request"
              icon={Activity}
              value={formatNumber(data.todayRequest)}
              hint="Sejak 00:00 hari ini"
            />
            <StatCard
              label="Total Request"
              icon={BarChart3}
              value={formatNumber(data.totalRequest)}
              hint="Sepanjang waktu"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">API Key</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <code className="min-w-0 flex-1 truncate rounded-lg bg-muted px-3 py-2 font-mono text-sm">
                    {maskApiKey(data.apiKey)}
                  </code>
                  <CopyButton value={data.apiKey} />
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard/api-key">Kelola</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Whitelist IP</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-2xl font-semibold tabular-nums tracking-tight">
                    {formatNumber(data.whitelistCount)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    IP terdaftar
                    {data.whitelistCount === 0
                      ? " — semua IP diizinkan"
                      : null}
                  </p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard/whitelist">Kelola</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Premium</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.role === "premium" && !premiumExpired ? (
                  <div>
                    <p className="text-sm font-medium">
                      Aktif sampai{" "}
                      {data.premiumExpiresAt
                        ? formatDate(data.premiumExpiresAt)
                        : "—"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Limit tinggi & akses semua endpoint premium.
                    </p>
                  </div>
                ) : data.role === "admin" ? (
                  <p className="text-sm text-muted-foreground">
                    Akun admin memiliki akses penuh ke semua endpoint.
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {premiumExpired
                        ? "Premium kamu sudah kadaluarsa. Perpanjang untuk kembali mengakses endpoint premium."
                        : "Limit lebih besar & akses endpoint premium."}
                    </p>
                    <Button asChild size="sm">
                      <Link href="/pricing">Upgrade</Link>
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                Request 14 Hari Terakhir
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AreaChart data={data.usage} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Aktivitas Terbaru</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-2">
              {data.recentLogs.length === 0 ? (
                <p className="px-3 pb-4 text-sm text-muted-foreground">
                  Belum ada request. Mulai dengan memanggil salah satu endpoint.
                </p>
              ) : (
                <Table>
                  <TableBody>
                    {data.recentLogs.map((log) => (
                      <TableRow key={log._id}>
                        <TableCell className="max-w-[220px] truncate font-mono text-[13px]">
                          {log.endpoint}
                        </TableCell>
                        <TableCell>
                          <MethodBadge method={log.method} />
                        </TableCell>
                        <TableCell>
                          <StatusCodeBadge code={log.statusCode} />
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {timeAgo(log.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            <CardFooter className="border-t px-6 py-3">
              <Link
                href="/dashboard/history"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Lihat semua →
              </Link>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
}
