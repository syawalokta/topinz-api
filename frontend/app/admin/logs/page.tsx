"use client";

import * as React from "react";
import { buildQuery, useApi, useDebounce } from "@/lib/hooks";
import { formatDateTime, formatNumber } from "@/lib/format";
import type { HttpMethod, Paginated, RequestLog } from "@/lib/types";
import {
  TablePagination,
  TableSkeleton,
  TableToolbar,
} from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { MethodBadge, StatusCodeBadge } from "@/components/shared/method-badge";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const STATUS_GROUPS = ["2xx", "4xx", "5xx"] as const;
type StatusGroup = (typeof STATUS_GROUPS)[number];

function logUsername(log: RequestLog): string | null {
  if (log.user && typeof log.user === "object") return log.user.username;
  return null;
}

export default function AdminLogsPage() {
  const [page, setPage] = React.useState(1);
  const [q, setQ] = React.useState("");
  const qDeb = useDebounce(q);
  const [method, setMethod] = React.useState<"all" | HttpMethod>("all");
  const [status, setStatus] = React.useState<"all" | StatusGroup>("all");

  React.useEffect(() => {
    setPage(1);
  }, [qDeb, method, status]);

  const { data, error, loading, refetch } = useApi<Paginated<RequestLog>>(
    `/admin/logs${buildQuery({
      page,
      limit: 10,
      q: qDeb,
      method: method === "all" ? undefined : method,
      status: status === "all" ? undefined : status,
    })}`
  );

  const items = data?.items ?? [];
  const hasFilters = qDeb !== "" || method !== "all" || status !== "all";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Request Logs"
        description="Riwayat request public API dari seluruh pengguna."
      />

      <Card>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <TableToolbar
            search={q}
            onSearchChange={setQ}
            placeholder="Cari endpoint path…"
          >
            <Select
              value={method}
              onValueChange={(value) => setMethod(value as "all" | HttpMethod)}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua method</SelectItem>
                {METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as "all" | StatusGroup)}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua status</SelectItem>
                {STATUS_GROUPS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </TableToolbar>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>User</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">IP</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">
                    Durasi
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">Waktu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableSkeleton rows={10} cols={7} />
                ) : error ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={7} className="p-6">
                      <EmptyState
                        title="Gagal memuat logs"
                        description={error}
                        action={
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void refetch()}
                          >
                            Coba lagi
                          </Button>
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={7} className="p-6">
                      <EmptyState
                        title="Belum ada log"
                        description={
                          hasFilters
                            ? "Tidak ada log yang cocok dengan filter."
                            : "Request public API akan tercatat di sini."
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((log) => {
                    const username = logUsername(log);
                    return (
                      <TableRow key={log._id}>
                        <TableCell>
                          {username ? (
                            <span className="text-[13px] font-medium">
                              @{username}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="block max-w-[240px] truncate font-mono text-[13px]">
                            {log.endpoint}
                          </span>
                        </TableCell>
                        <TableCell>
                          <MethodBadge method={log.method} />
                        </TableCell>
                        <TableCell>
                          <StatusCodeBadge code={log.statusCode} />
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="font-mono text-xs text-muted-foreground">
                            {log.ip}
                          </span>
                        </TableCell>
                        <TableCell className="hidden text-right sm:table-cell">
                          <span className="text-xs tabular-nums text-muted-foreground">
                            {formatNumber(log.responseTimeMs)} ms
                          </span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="whitespace-nowrap text-xs text-muted-foreground">
                            {formatDateTime(log.createdAt)}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <TablePagination
            page={page}
            totalPages={data?.totalPages ?? 1}
            total={data?.total ?? 0}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
