"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ApiError, apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { PasswordInput } from "@/components/shared/password-input";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red-500">{message}</p>;
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>(
    {}
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);

  if (!token) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 py-8 text-center">
            <h1 className="text-lg font-semibold tracking-tight">
              Link tidak valid
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Token reset tidak ditemukan atau sudah kedaluwarsa. Minta link
              reset password yang baru.
            </p>
            <Button asChild variant="outline" className="mt-5">
              <Link href="/forgot-password">Minta link baru</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (done) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center p-6 py-8 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </span>
          <h1 className="mt-4 text-lg font-semibold tracking-tight">
            Password berhasil direset
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Password kamu sudah diperbarui. Silakan login dengan password baru.
          </p>
          <Button asChild className="mt-5 w-full">
            <Link href="/login">Ke halaman login</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    const errors: Record<string, string> = {};
    if (password.length < 8) errors.password = "Password minimal 8 karakter";
    if (confirmPassword !== password)
      errors.confirmPassword = "Konfirmasi password tidak sama";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      await apiPost("/auth/reset-password", {
        token,
        password,
        confirmPassword,
      });
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.fieldErrors);
        toast.error(err.message);
      } else {
        toast.error("Terjadi kesalahan. Coba lagi.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-xl font-semibold tracking-tight">
          Reset password
        </h1>
        <p className="text-sm text-muted-foreground">
          Buat password baru untuk akun kamu.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="password">Password baru</Label>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              {fieldErrors.password ? (
                <FieldError message={fieldErrors.password} />
              ) : (
                <p className="text-xs text-muted-foreground">
                  Minimal 8 karakter
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Konfirmasi password</Label>
              <PasswordInput
                id="confirmPassword"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
              <FieldError message={fieldErrors.confirmPassword} />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" /> : null}
              Reset password
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        Ingat password kamu?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Login
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <React.Suspense
      fallback={
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <Skeleton className="mx-auto h-6 w-40" />
            <Skeleton className="mx-auto h-4 w-52" />
          </div>
          <Skeleton className="h-[280px] w-full rounded-xl" />
        </div>
      }
    >
      <ResetPasswordForm />
    </React.Suspense>
  );
}
