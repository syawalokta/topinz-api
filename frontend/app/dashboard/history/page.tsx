"use client";

import * as React from "react";
import { buildQuery, useApi, useDebounce } from "@/lib/hooks";
import { formatDateTime, formatNumber } from "@/lib/format";
import type { Paginated, RequestLog } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardFooter } from "@/components/ui/card";
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
import {
  TablePagination,
  TableSkeleton,
  TableToolbar,
} from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { MethodBadge, StatusCodeBadge } from "@/components/shared/method-badge";
import { PageHeader } from "@/components/shared/page-header";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

export default function HistoryPage() {
  const [page, setPage] = React.useState(1);
  const [q, setQ] = React.useState("");
  const [method, setMethod] = React.useState("all");
  const [status, setStatus] = React.useState("all");
  const qDebounced = useDebounce(q);

  // Back to page 1 whenever a filter changes.
  React.useEffect(() => {
    setPage(1);
  }, [qDebounced, method, status]);

  const path = `/logs${buildQuery({
    page,
    limit: 10,
    q: qDebounced,
    method: method === "all" ? undefined : method,
    status: status === "all" ? undefined : status,
  })}`;
  const { data, error, loading, refetch } = useApi<Paginated<RequestLog>>(path);

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Request History"
        description="Semua request yang dibuat dengan API key kamu."
      />

      <Card>
        <div className="p-4 sm:p-6 sm:pb-4">
          <TableToolbar
            search={q}
            onSearchChange={setQ}
            placeholder="Cari endpoint…"
          >
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="w-[130px]" aria-label="Filter method">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                {METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[150px]" aria-label="Filter status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="2xx">2xx Success</SelectItem>
                <SelectItem value="4xx">4xx Client Error</SelectItem>
                <SelectItem value="5xx">5xx Server Error</SelectItem>
              </SelectContent>
            </Select>
          </TableToolbar>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Endpoint</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>Durasi</TableHead>
              <TableHead>Tanggal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableSkeleton rows={10} cols={6} />
            ) : error ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="p-6">
                  <EmptyState
                    title="Gagal memuat request history"
                    description={error}
                    className="border-none py-10"
                    action={
                      <Button
                        variant="outline"
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
                <TableCell colSpan={6} className="p-6">
                  <EmptyState
                    title="Tidak ada request"
                    description="Belum ada request yang cocok. Coba ubah filter atau kata kunci pencarian."
                    className="border-none py-10"
                  />
                </TableCell>
              </TableRow>
            ) : (
              items.map((log) => (
                <TableRow key={log._id}>
                  <TableCell className="max-w-[260px] truncate font-mono text-[13px]">
                    {log.endpoint}
                  </TableCell>
                  <TableCell>
                    <MethodBadge method={log.method} />
                  </TableCell>
                  <TableCell>
                    <StatusCodeBadge code={log.statusCode} />
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {log.ip}
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {formatNumber(log.responseTimeMs)} ms
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatDateTime(log.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <CardFooter className="border-t px-4 py-3 sm:px-6">
          <TablePagination
            className="w-full"
            page={data?.page ?? page}
            totalPages={data?.totalPages ?? 1}
            total={data?.total ?? 0}
            onPageChange={setPage}
          />
        </CardFooter>
      </Card>
    </div>
  );
}
