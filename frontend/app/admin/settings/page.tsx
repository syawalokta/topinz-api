"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ApiError, apiPut } from "@/lib/api";
import { buildQuery, useApi } from "@/lib/hooks";
import { timeAgo } from "@/lib/format";
import type { AuditLogItem, Paginated, Settings } from "@/lib/types";
import { TablePagination, TableSkeleton } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

function SettingsSkeleton() {
  return (
    <div className="space-y-5">
      {Array.from({ length: 2 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function AdminSettingsPage() {
  const { data, error, loading, refetch } =
    useApi<{ settings: Settings }>("/admin/settings");

  const [form, setForm] = React.useState<Settings | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (data) setForm(data.settings);
  }, [data]);

  const [auditPage, setAuditPage] = React.useState(1);
  const audit = useApi<Paginated<AuditLogItem>>(
    `/admin/audit${buildQuery({ page: auditPage, limit: 8 })}`
  );

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      await apiPut("/admin/settings", {
        siteName: form.siteName.trim(),
        siteDescription: form.siteDescription.trim(),
        maintenanceMode: form.maintenanceMode,
        allowRegistration: form.allowRegistration,
      });
      toast.success("Settings disimpan");
      await refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  };

  const auditItems = audit.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Konfigurasi platform dan jejak aktivitas admin."
      />

      {loading ? (
        <SettingsSkeleton />
      ) : error || !form ? (
        <EmptyState
          title="Gagal memuat settings"
          description={error ?? "Terjadi kesalahan saat memuat data."}
          action={
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Coba lagi
            </Button>
          }
        />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Umum</CardTitle>
              <CardDescription>
                Identitas platform yang tampil di halaman publik.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="site-name">Site Name</Label>
                <Input
                  id="site-name"
                  value={form.siteName}
                  onChange={(e) =>
                    setForm({ ...form, siteName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="site-description">Site Description</Label>
                <Textarea
                  id="site-description"
                  value={form.siteDescription}
                  onChange={(e) =>
                    setForm({ ...form, siteDescription: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Kontrol</CardTitle>
              <CardDescription>
                Sakelar operasional untuk seluruh platform.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium">Maintenance Mode</p>
                  <p className="text-xs text-muted-foreground">
                    Public API akan merespons 503.
                  </p>
                </div>
                <Switch
                  checked={form.maintenanceMode}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, maintenanceMode: checked })
                  }
                  aria-label="Maintenance mode"
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium">Allow Registration</p>
                  <p className="text-xs text-muted-foreground">
                    Pengguna baru dapat mendaftar.
                  </p>
                </div>
                <Switch
                  checked={form.allowRegistration}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, allowRegistration: checked })
                  }
                  aria-label="Allow registration"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={() => void save()} disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : null}
              Simpan
            </Button>
          </div>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audit Log</CardTitle>
          <CardDescription>
            Aksi admin terbaru yang tercatat oleh sistem.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Aktor</TableHead>
                  <TableHead>Aksi</TableHead>
                  <TableHead className="hidden md:table-cell">Target</TableHead>
                  <TableHead className="hidden sm:table-cell">IP</TableHead>
                  <TableHead>Waktu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {audit.loading ? (
                  <TableSkeleton rows={8} cols={5} />
                ) : audit.error ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={5} className="p-6">
                      <EmptyState
                        title="Gagal memuat audit log"
                        description={audit.error}
                        action={
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void audit.refetch()}
                          >
                            Coba lagi
                          </Button>
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : auditItems.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={5} className="p-6">
                      <EmptyState
                        title="Belum ada audit log"
                        description="Aksi admin akan tercatat di sini."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  auditItems.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell>
                        <span className="text-[13px] font-medium">
                          {item.actor ? `@${item.actor.username}` : "system"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs">
                          {item.action}
                        </code>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="block max-w-[220px] truncate text-[13px] text-muted-foreground">
                          {item.target || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="font-mono text-xs text-muted-foreground">
                          {item.ip}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="whitespace-nowrap text-xs text-muted-foreground">
                          {timeAgo(item.createdAt)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <TablePagination
            page={auditPage}
            totalPages={audit.data?.totalPages ?? 1}
            total={audit.data?.total ?? 0}
            onPageChange={setAuditPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
