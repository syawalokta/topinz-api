"use client";

import * as React from "react";
import { Info, Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ApiError, apiDelete, apiPost, apiPut } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import { formatDate } from "@/lib/format";
import type { WhitelistIP } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";

const MAX_IPS = 10;

function validateIp(ip: string): string | null {
  const parts = ip.split(".");
  if (
    parts.length !== 4 ||
    parts.some((p) => !/^\d{1,3}$/.test(p) || Number(p) > 255)
  ) {
    return "Format IPv4 tidak valid (contoh: 103.10.20.30)";
  }
  if (ip === "0.0.0.0") return "IP 0.0.0.0 tidak diizinkan";
  return null;
}

export default function WhitelistPage() {
  const { data, error, loading, refetch } = useApi<{ items: WhitelistIP[] }>(
    "/whitelist"
  );
  const items = data?.items ?? [];

  // Add/Edit dialog
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<WhitelistIP | null>(null);
  const [ip, setIp] = React.useState("");
  const [label, setLabel] = React.useState("");
  const [ipError, setIpError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  // Delete confirm
  const [deleting, setDeleting] = React.useState<WhitelistIP | null>(null);

  const openAdd = () => {
    setEditing(null);
    setIp("");
    setLabel("");
    setIpError(null);
    setDialogOpen(true);
  };

  const openEdit = (item: WhitelistIP) => {
    setEditing(item);
    setIp(item.ip);
    setLabel(item.label ?? "");
    setIpError(null);
    setDialogOpen(true);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving) return;

    const trimmedIp = ip.trim();
    const invalid = validateIp(trimmedIp);
    setIpError(invalid);
    if (invalid) return;

    setSaving(true);
    try {
      const body = { ip: trimmedIp, label: label.trim() || undefined };
      if (editing) {
        await apiPut(`/whitelist/${editing._id}`, body);
        toast.success("IP berhasil diperbarui");
      } else {
        await apiPost("/whitelist", body);
        toast.success("IP berhasil ditambahkan");
      }
      setDialogOpen(false);
      await refetch();
    } catch (err) {
      if (err instanceof ApiError) {
        const fieldError = err.fieldErrors.ip;
        if (fieldError) setIpError(fieldError);
        else toast.error(err.message);
      } else {
        toast.error("Terjadi kesalahan. Coba lagi.");
      }
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (item: WhitelistIP) => {
    try {
      await apiDelete(`/whitelist/${item._id}`);
      toast.success("IP berhasil dihapus");
      await refetch();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Gagal menghapus IP"
      );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Whitelist IP"
        description="Batasi akses API key kamu ke alamat IP tertentu."
        actions={
          <Button onClick={openAdd} disabled={items.length >= MAX_IPS}>
            <Plus />
            Tambah IP
          </Button>
        }
      />

      <div className="flex items-start gap-2.5 rounded-xl border bg-muted/50 p-4 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Whitelist kosong berarti semua IP diizinkan. IP{" "}
          <span className="font-mono text-[13px]">0.0.0.0</span> selalu diblok.
          Maksimal {MAX_IPS} IP.
        </p>
      </div>

      {error ? (
        <EmptyState
          title="Gagal memuat whitelist"
          description={error}
          action={
            <Button variant="outline" onClick={() => void refetch()}>
              Coba lagi
            </Button>
          }
        />
      ) : !loading && items.length === 0 ? (
        <EmptyState
          title="Belum ada whitelist IP"
          description="Semua IP saat ini diizinkan mengakses API key kamu. Tambahkan IP untuk membatasi akses."
          action={
            <Button variant="outline" onClick={openAdd}>
              <Plus />
              Tambah IP
            </Button>
          }
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>IP</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Ditambahkan</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeleton rows={4} cols={4} />
              ) : (
                items.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell className="font-mono text-[13px]">
                      {item.ip}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.label || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(item.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={`Aksi untuk ${item.ip}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem onClick={() => openEdit(item)}>
                            <Pencil />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleting(item)}
                            className="text-red-600 focus:text-red-600 dark:text-red-400"
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
        </Card>
      )}

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit IP" : "Tambah IP"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Perbarui alamat IP atau label."
                : "Hanya request dari IP di whitelist yang diizinkan."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="wl-ip">Alamat IP</Label>
              <Input
                id="wl-ip"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                placeholder="103.10.20.30"
                className="font-mono"
                autoFocus
              />
              {ipError ? (
                <p className="text-xs text-red-500">{ipError}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="wl-label">
                Label{" "}
                <span className="font-normal text-muted-foreground">
                  (opsional)
                </span>
              </Label>
              <Input
                id="wl-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Server production"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="animate-spin" /> : null}
                {editing ? "Simpan" : "Tambah"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus IP dari whitelist?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting ? (
                <>
                  <span className="font-mono text-[13px] text-foreground">
                    {deleting.ip}
                  </span>{" "}
                  akan dihapus.{" "}
                </>
              ) : null}
              Jika whitelist menjadi kosong, semua IP kembali diizinkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleting) void onDelete(deleting);
              }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
