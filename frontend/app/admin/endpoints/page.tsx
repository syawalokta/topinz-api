"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ApiError, apiDelete, apiPatch } from "@/lib/api";
import { buildQuery, useApi, useDebounce } from "@/lib/hooks";
import type { ApiEndpoint, Category, HttpMethod, Paginated } from "@/lib/types";
import {
  TablePagination,
  TableSkeleton,
  TableToolbar,
} from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { MethodBadge } from "@/components/shared/method-badge";
import { PageHeader } from "@/components/shared/page-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

function errorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : "Terjadi kesalahan";
}

function statusBadge(status: ApiEndpoint["status"]) {
  if (status === "active") return <Badge variant="success">Active</Badge>;
  if (status === "maintenance")
    return <Badge variant="warning">Maintenance</Badge>;
  return <Badge variant="secondary">Deprecated</Badge>;
}

export default function AdminEndpointsPage() {
  const [page, setPage] = React.useState(1);
  const [q, setQ] = React.useState("");
  const qDeb = useDebounce(q);
  const [category, setCategory] = React.useState<string>("all");
  const [method, setMethod] = React.useState<"all" | HttpMethod>("all");

  React.useEffect(() => {
    setPage(1);
  }, [qDeb, category, method]);

  const { data, error, loading, refetch } = useApi<Paginated<ApiEndpoint>>(
    `/endpoint${buildQuery({
      all: true,
      page,
      limit: 10,
      q: qDeb,
      category: category === "all" ? undefined : category,
      method: method === "all" ? undefined : method,
    })}`
  );
  const { data: categoriesData } = useApi<{ items: Category[] }>(
    "/categories?all=true"
  );
  const categories = categoriesData?.items;

  // Local mirror for the optimistic published toggle.
  const [items, setItems] = React.useState<ApiEndpoint[]>([]);
  React.useEffect(() => {
    if (data) setItems(data.items);
  }, [data]);

  const [deleting, setDeleting] = React.useState<ApiEndpoint | null>(null);
  const [deletingBusy, setDeletingBusy] = React.useState(false);

  const togglePublished = async (endpoint: ApiEndpoint, published: boolean) => {
    setItems((prev) =>
      prev.map((e) => (e._id === endpoint._id ? { ...e, published } : e))
    );
    try {
      await apiPatch(`/endpoint/${endpoint._id}/publish`, { published });
      toast.success(
        published ? "Endpoint dipublikasikan" : "Endpoint disembunyikan"
      );
    } catch (err) {
      setItems((prev) =>
        prev.map((e) =>
          e._id === endpoint._id
            ? { ...e, published: endpoint.published }
            : e
        )
      );
      toast.error(errorMessage(err));
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeletingBusy(true);
    try {
      await apiDelete(`/endpoint/${deleting._id}`);
      toast.success("Endpoint dihapus");
      setDeleting(null);
      await refetch();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setDeletingBusy(false);
    }
  };

  const hasFilters = qDeb !== "" || category !== "all" || method !== "all";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Endpoint"
        description="Kelola endpoint API, dokumentasi, dan publikasinya."
        actions={
          <Button asChild>
            <Link href="/admin/endpoints/new">
              <Plus />
              Tambah Endpoint
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <TableToolbar
            search={q}
            onSearchChange={setQ}
            placeholder="Cari nama atau path…"
          >
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua kategori</SelectItem>
                {(categories ?? []).map((c) => (
                  <SelectItem key={c._id} value={c.slug}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          </TableToolbar>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Nama</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Kategori
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead className="w-[60px] text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableSkeleton rows={10} cols={7} />
                ) : error ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={7} className="p-6">
                      <EmptyState
                        title="Gagal memuat endpoint"
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
                        title="Belum ada endpoint"
                        description={
                          hasFilters
                            ? "Tidak ada endpoint yang cocok dengan filter."
                            : "Tambahkan endpoint pertama untuk mengisi katalog API."
                        }
                        action={
                          <Button asChild size="sm">
                            <Link href="/admin/endpoints/new">
                              <Plus />
                              Tambah Endpoint
                            </Link>
                          </Button>
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((endpoint) => (
                    <TableRow key={endpoint._id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{endpoint.name}</span>
                          {endpoint.premiumOnly ? (
                            <Badge variant="info" className="px-1.5 text-[10px]">
                              Premium
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <MethodBadge method={endpoint.method} />
                      </TableCell>
                      <TableCell>
                        <span className="block max-w-[220px] truncate font-mono text-[13px] text-muted-foreground">
                          {endpoint.path}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {typeof endpoint.category === "object" &&
                        endpoint.category !== null
                          ? endpoint.category.name
                          : "—"}
                      </TableCell>
                      <TableCell>{statusBadge(endpoint.status)}</TableCell>
                      <TableCell>
                        <Switch
                          checked={endpoint.published}
                          onCheckedChange={(checked) =>
                            void togglePublished(endpoint, checked)
                          }
                          aria-label={`Publikasi ${endpoint.name}`}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label="Aksi endpoint"
                            >
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/endpoints/${endpoint._id}`}>
                                <Pencil />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600 dark:text-red-400"
                              onClick={() => setDeleting(endpoint)}
                            >
                              <Trash2 />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
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

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus endpoint?</AlertDialogTitle>
            <AlertDialogDescription>
              Endpoint{" "}
              <span className="font-medium text-foreground">
                {deleting?.name}
              </span>{" "}
              beserta dokumentasinya akan dihapus permanen dari katalog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingBusy}>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletingBusy}
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
            >
              {deletingBusy ? <Loader2 className="animate-spin" /> : null}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
