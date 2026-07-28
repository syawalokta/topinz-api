"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ApiError, apiPut } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate, formatNumber } from "@/lib/format";
import type { Role, User } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { PasswordInput } from "@/components/shared/password-input";
import {
  PhoneInput,
  normalizePhoneDigits,
} from "@/components/dashboard/phone-input";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red-500">{message}</p>;
}

function roleBadgeVariant(role: Role) {
  if (role === "admin") return "info" as const;
  if (role === "premium") return "success" as const;
  return "secondary" as const;
}

function isPremiumExpired(user: User): boolean {
  if (user.premiumExpired !== undefined) return user.premiumExpired;
  return (
    user.premiumExpiresAt !== null &&
    new Date(user.premiumExpiresAt).getTime() < Date.now()
  );
}

export default function SettingsPage() {
  const { user, refresh } = useAuth();

  // Profil
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [profileErrors, setProfileErrors] = React.useState<
    Record<string, string>
  >({});
  const [savingProfile, setSavingProfile] = React.useState(false);

  // Password
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [passwordErrors, setPasswordErrors] = React.useState<
    Record<string, string>
  >({});
  const [savingPassword, setSavingPassword] = React.useState(false);

  React.useEffect(() => {
    if (!user) return;
    setName(user.name);
    setPhone(normalizePhoneDigits(user.phone));
  }, [user]);

  const saveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (savingProfile) return;

    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = "Nama wajib diisi";
    if (phone.length < 8 || phone.length > 13)
      errors.phone = "Nomor harus 8–13 digit setelah +62";
    setProfileErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSavingProfile(true);
    try {
      await apiPut("/user/profile", {
        name: name.trim(),
        phone: `+62${phone}`,
      });
      toast.success("Profil diperbarui");
      await refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setProfileErrors(err.fieldErrors);
        toast.error(err.message);
      } else {
        toast.error("Terjadi kesalahan. Coba lagi.");
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (savingPassword) return;

    const errors: Record<string, string> = {};
    if (!currentPassword)
      errors.currentPassword = "Password saat ini wajib diisi";
    if (newPassword.length < 8)
      errors.newPassword = "Password baru minimal 8 karakter";
    if (confirmPassword !== newPassword)
      errors.confirmPassword = "Konfirmasi password tidak sama";
    setPasswordErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSavingPassword(true);
    try {
      await apiPut("/user/password", {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      toast.success("Password berhasil diubah");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordErrors({});
    } catch (err) {
      if (err instanceof ApiError) {
        setPasswordErrors(err.fieldErrors);
        toast.error(err.message);
      } else {
        toast.error("Terjadi kesalahan. Coba lagi.");
      }
    } finally {
      setSavingPassword(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl space-y-6">
        <PageHeader
          title="Settings"
          description="Kelola profil dan keamanan akun kamu."
        />
        <Skeleton className="h-[380px] rounded-xl" />
        <Skeleton className="h-[300px] rounded-xl" />
        <Skeleton className="h-[120px] rounded-xl" />
      </div>
    );
  }

  const premiumExpired = isPremiumExpired(user);

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="Settings"
        description="Kelola profil dan keamanan akun kamu."
      />

      <Card>
        <form onSubmit={saveProfile} noValidate>
          <CardHeader>
            <CardTitle className="text-sm">Profil</CardTitle>
            <CardDescription>
              Informasi dasar akun Topinz API kamu.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama</Label>
              <Input
                id="name"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <FieldError message={profileErrors.name} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Nomor WhatsApp</Label>
              <PhoneInput id="phone" value={phone} onChange={setPhone} />
              <FieldError message={profileErrors.phone} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user.email} disabled />
                <p className="text-xs text-muted-foreground">
                  Tidak dapat diubah
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" value={user.username} disabled />
                <p className="text-xs text-muted-foreground">
                  Tidak dapat diubah
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-end border-t px-6 py-4">
            <Button type="submit" size="sm" disabled={savingProfile}>
              {savingProfile ? <Loader2 className="animate-spin" /> : null}
              Simpan perubahan
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <form onSubmit={savePassword} noValidate>
          <CardHeader>
            <CardTitle className="text-sm">Ubah Password</CardTitle>
            <CardDescription>
              Gunakan password yang kuat dan unik.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Password saat ini</Label>
              <PasswordInput
                id="currentPassword"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <FieldError message={passwordErrors.currentPassword} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Password baru</Label>
              <PasswordInput
                id="newPassword"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              {passwordErrors.newPassword ? (
                <FieldError message={passwordErrors.newPassword} />
              ) : (
                <p className="text-xs text-muted-foreground">
                  Minimal 8 karakter
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Konfirmasi password baru</Label>
              <PasswordInput
                id="confirmPassword"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <FieldError message={passwordErrors.confirmPassword} />
            </div>
          </CardContent>
          <CardFooter className="justify-end border-t px-6 py-4">
            <Button type="submit" size="sm" disabled={savingPassword}>
              {savingPassword ? <Loader2 className="animate-spin" /> : null}
              Ubah password
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Plan</CardTitle>
          <CardDescription>Paket dan limit akun kamu.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant={roleBadgeVariant(user.role)} className="capitalize">
              {user.role}
            </Badge>
            <span className="text-muted-foreground">
              {formatNumber(user.limit)} request/hari
            </span>
          </div>

          {user.role === "premium" ? (
            <p className="text-sm text-muted-foreground">
              {premiumExpired
                ? "Premium kadaluarsa"
                : user.premiumExpiresAt
                  ? `Berlaku sampai ${formatDate(user.premiumExpiresAt)}`
                  : "Premium aktif"}
            </p>
          ) : null}

          {user.role === "free" || premiumExpired ? (
            <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/50 p-3">
              <p className="text-sm text-muted-foreground">
                Butuh limit lebih besar & endpoint premium?
              </p>
              <Button asChild size="sm" className="shrink-0">
                <Link href="/pricing">Upgrade</Link>
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
