"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ApiError, apiDelete, apiPost, apiPut } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import { formatNumber } from "@/lib/format";
import type { Category } from "@/lib/types";
import { TableSkeleton } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

function errorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : "Terjadi kesalahan";
}

interface CategoryFormState {
  name: string;
  description: string;
  active: boolean;
}

const emptyForm: CategoryFormState = { name: "", description: "", active: true };

export default function AdminCategoriesPage() {
  // GET /categories?all=true (admin) → data: { items: Category[] }
  // (incl. inactive, each with endpointCount).
  const { data, error, loading, refetch } =
    useApi<{ items: Category[] }>("/categories?all=true");

  // Local mirror for optimistic toggles + reordering.
  const [items, setItems] = React.useState<Category[]>([]);
  React.useEffect(() => {
    if (data) setItems(data.items);
  }, [data]);

  // Create / edit dialog
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Category | null>(null);
  const [form, setForm] = React.useState<CategoryFormState>(emptyForm);
  const [saving, setSaving] = React.useState(false);

  // Delete dialog
  const [deleting, setDeleting] = React.useState<Category | null>(null);
  const [deletingBusy, setDeletingBusy] = React.useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setForm({
      name: category.name,
      description: category.description,
      active: category.active,
    });
    setDialogOpen(true);
  };

  const submitForm = async () => {
    if (!form.name.trim()) {
      toast.error("Nama kategori wajib diisi");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await apiPut(`/categories/${editing._id}`, {
          name: form.name.trim(),
          description: form.description.trim(),
          active: form.active,
        });
        toast.success("Kategori diperbarui");
      } else {
        await apiPost("/categories", {
          name: form.name.trim(),
          description: form.description.trim(),
          active: form.active,
        });
        toast.success("Kategori ditambahkan");
      }
      setDialogOpen(false);
      await refetch();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (category: Category, active: boolean) => {
    setItems((prev) =>
      prev.map((c) => (c._id === category._id ? { ...c, active } : c))
    );
    try {
      await apiPut(`/categories/${category._id}`, { active });
      toast.success(
        active ? "Kategori diaktifkan" : "Kategori dinonaktifkan"
      );
    } catch (err) {
      setItems((prev) =>
        prev.map((c) =>
          c._id === category._id ? { ...c, active: category.active } : c
        )
      );
      toast.error(errorMessage(err));
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
    try {
      await apiPut("/categories/reorder", { ids: next.map((c) => c._id) });
    } catch (err) {
      toast.error(errorMessage(err));
      await refetch();
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeletingBusy(true);
    try {
      await apiDelete(`/categories/${deleting._id}`);
      toast.success("Kategori dihapus");
      setDeleting(null);
      await refetch();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setDeletingBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kategori"
        description="Kelola kategori untuk mengelompokkan endpoint API."
        actions={
          <Button onClick={openCreate}>
            <Plus />
            Tambah Kategori
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[90px]">Urutan</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead className="hidden md:table-cell">
                  Deskripsi
                </TableHead>
                <TableHead className="text-right">Endpoints</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[60px] text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeleton rows={6} cols={6} />
              ) : error ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="p-6">
                    <EmptyState
                      title="Gagal memuat kategori"
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
                  <TableCell colSpan={6} className="p-6">
                    <EmptyState
                      title="Belum ada kategori"
                      description="Tambahkan kategori pertama untuk mulai mengelompokkan endpoint."
                      action={
                        <Button size="sm" onClick={openCreate}>
                          <Plus />
                          Tambah Kategori
                        </Button>
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                items.map((category, index) => (
                  <TableRow key={category._id}>
                    <TableCell>
                      <div className="flex items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          disabled={index === 0}
                          onClick={() => void move(index, -1)}
                          aria-label="Naikkan urutan"
                        >
                          <ArrowUp />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          disabled={index === items.length - 1}
                          onClick={() => void move(index, 1)}
                          aria-label="Turunkan urutan"
                        >
                          <ArrowDown />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{category.name}</span>
                      <span className="block font-mono text-xs text-muted-foreground">
                        {category.slug}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="block max-w-[280px] truncate text-muted-foreground">
                        {category.description || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(category.endpointCount ?? 0)}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={category.active}
                        onCheckedChange={(checked) =>
                          void toggleActive(category, checked)
                        }
                        aria-label={`Status ${category.name}`}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label="Aksi kategori"
                          >
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => openEdit(category)}>
                            <Pencil />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600 dark:text-red-400"
                            onClick={() => setDeleting(category)}
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
        </CardContent>
      </Card>

      {/* Create / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Kategori" : "Tambah Kategori"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Perbarui detail kategori."
                : "Kategori baru untuk mengelompokkan endpoint."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Nama</Label>
              <Input
                id="category-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Tools"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-description">Deskripsi</Label>
              <Textarea
                id="category-description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Kumpulan endpoint utilitas developer."
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
              <div>
                <p className="text-sm font-medium">Aktif</p>
                <p className="text-xs text-muted-foreground">
                  Kategori aktif tampil di dokumentasi publik.
                </p>
              </div>
              <Switch
                checked={form.active}
                onCheckedChange={(checked) =>
                  setForm({ ...form, active: checked })
                }
                aria-label="Kategori aktif"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Batal
            </Button>
            <Button onClick={() => void submitForm()} disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : null}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus kategori?</AlertDialogTitle>
            <AlertDialogDescription>
              Kategori{" "}
              <span className="font-medium text-foreground">
                {deleting?.name}
              </span>{" "}
              akan dihapus permanen. Kategori dengan endpoint tidak dapat
              dihapus.
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
