"use client";

import * as React from "react";
import { Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ApiError, apiDelete, apiPut } from "@/lib/api";
import { buildQuery, useApi, useDebounce } from "@/lib/hooks";
import { formatDate, formatNumber } from "@/lib/format";
import type { Paginated, Role, User } from "@/lib/types";
import {
  TablePagination,
  TableSkeleton,
  TableToolbar,
} from "@/components/shared/data-table";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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

const ROLES: Role[] = ["free", "premium", "admin"];

function errorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : "Terjadi kesalahan";
}

function roleBadgeVariant(role: Role) {
  if (role === "admin") return "info" as const;
  if (role === "premium") return "success" as const;
  return "secondary" as const;
}

interface EditState {
  user: User;
  name: string;
  role: Role;
  limit: string;
  premiumExpires: string; // yyyy-mm-dd
}

export default function AdminUsersPage() {
  const [page, setPage] = React.useState(1);
  const [q, setQ] = React.useState("");
  const qDeb = useDebounce(q);
  const [role, setRole] = React.useState<"all" | Role>("all");

  React.useEffect(() => {
    setPage(1);
  }, [qDeb, role]);

  const { data, error, loading, refetch } = useApi<Paginated<User>>(
    `/admin/users${buildQuery({
      page,
      limit: 10,
      q: qDeb,
      role: role === "all" ? undefined : role,
    })}`
  );

  const [editing, setEditing] = React.useState<EditState | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState<User | null>(null);
  const [deletingBusy, setDeletingBusy] = React.useState(false);

  const openEdit = (user: User) => {
    setEditing({
      user,
      name: user.name,
      role: user.role,
      limit: String(user.limit),
      premiumExpires: user.premiumExpiresAt
        ? user.premiumExpiresAt.slice(0, 10)
        : "",
    });
  };

  const submitEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await apiPut(`/admin/users/${editing.user._id}`, {
        name: editing.name.trim(),
        role: editing.role,
        limit: Number(editing.limit) || 0,
        premiumExpiresAt:
          editing.role === "premium" && editing.premiumExpires
            ? new Date(editing.premiumExpires).toISOString()
            : null,
      });
      toast.success("User diperbarui");
      setEditing(null);
      await refetch();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeletingBusy(true);
    try {
      await apiDelete(`/admin/users/${deleting._id}`);
      toast.success("User dihapus");
      setDeleting(null);
      await refetch();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setDeletingBusy(false);
    }
  };

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Kelola akun, role, dan limit harian pengguna."
      />

      <Card>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <TableToolbar
            search={q}
            onSearchChange={setQ}
            placeholder="Cari username atau email…"
          >
            <Select
              value={role}
              onValueChange={(value) => setRole(value as "all" | Role)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua role</SelectItem>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r} className="capitalize">
                    {r}
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
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Limit/hari</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Premium sampai
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Terdaftar
                  </TableHead>
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
                        title="Gagal memuat users"
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
                        title="Tidak ada user"
                        description="Tidak ada user yang cocok dengan pencarian atau filter."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {user.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{user.name}</p>
                            <p className="block truncate text-xs text-muted-foreground">
                              @{user.username}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={roleBadgeVariant(user.role)}
                          className="capitalize"
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(user.limit)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {user.premiumExpiresAt
                          ? formatDate(user.premiumExpiresAt)
                          : "—"}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground lg:table-cell">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label="Aksi user"
                            >
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => openEdit(user)}>
                              <Pencil />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600 dark:text-red-400"
                              onClick={() => setDeleting(user)}
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

      {/* Edit dialog */}
      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              {editing ? `@${editing.user.username} · ${editing.user.email}` : ""}
            </DialogDescription>
          </DialogHeader>
          {editing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user-name">Name</Label>
                <Input
                  id="user-name"
                  value={editing.name}
                  onChange={(e) =>
                    setEditing({ ...editing, name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={editing.role}
                    onValueChange={(value) =>
                      setEditing({ ...editing, role: value as Role })
                    }
                  >
                    <SelectTrigger className="capitalize">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r} className="capitalize">
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-limit">Limit/hari</Label>
                  <Input
                    id="user-limit"
                    type="number"
                    min={0}
                    value={editing.limit}
                    onChange={(e) =>
                      setEditing({ ...editing, limit: e.target.value })
                    }
                  />
                </div>
              </div>
              {editing.role === "premium" ? (
                <div className="space-y-2">
                  <Label htmlFor="user-premium-expires">Premium Expires</Label>
                  <Input
                    id="user-premium-expires"
                    type="date"
                    value={editing.premiumExpires}
                    onChange={(e) =>
                      setEditing({ ...editing, premiumExpires: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Kosongkan untuk tanpa batas waktu.
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditing(null)}
              disabled={saving}
            >
              Batal
            </Button>
            <Button onClick={() => void submitEdit()} disabled={saving}>
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
            <AlertDialogTitle>Hapus user?</AlertDialogTitle>
            <AlertDialogDescription>
              Akun{" "}
              <span className="font-medium text-foreground">
                @{deleting?.username}
              </span>{" "}
              akan dihapus permanen. Request logs miliknya tetap disimpan.
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
