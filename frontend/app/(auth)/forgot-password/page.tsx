"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ApiError, apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [fieldError, setFieldError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [resetToken, setResetToken] = React.useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    if (!EMAIL_RE.test(email.trim())) {
      setFieldError("Email tidak valid");
      return;
    }
    setFieldError(null);

    setSubmitting(true);
    try {
      const data = await apiPost<{ resetToken?: string } | null>(
        "/auth/forgot-password",
        { email: email.trim() }
      );
      setResetToken(data?.resetToken ?? null);
      setSent(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldError(err.fieldErrors.email ?? null);
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
      {!sent ? (
        <>
          <div className="space-y-1.5 text-center">
            <h1 className="text-xl font-semibold tracking-tight">
              Lupa password
            </h1>
            <p className="text-sm text-muted-foreground">
              Masukkan email kamu, kami kirim link untuk reset password.
            </p>
          </div>

          <Card>
            <CardContent className="p-6">
              <form onSubmit={onSubmit} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="kamu@example.com"
                  />
                  {fieldError ? (
                    <p className="text-xs text-red-500">{fieldError}</p>
                  ) : null}
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? <Loader2 className="animate-spin" /> : null}
                  Kirim link reset
                </Button>
              </form>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center p-6 py-8 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </span>
            <h1 className="mt-4 text-lg font-semibold tracking-tight">
              Cek email kamu
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Jika <span className="font-medium text-foreground">{email}</span>{" "}
              terdaftar, kami sudah mengirim link untuk reset password. Link
              berlaku sementara — cek juga folder spam.
            </p>
            {resetToken ? (
              <div className="mt-4 w-full rounded-lg border border-dashed bg-muted/50 p-3 text-xs text-muted-foreground">
                Dev: token reset —{" "}
                <Link
                  href={`/reset-password?token=${encodeURIComponent(resetToken)}`}
                  className="font-medium text-foreground underline underline-offset-4"
                >
                  buka halaman reset
                </Link>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      <p className="text-center text-sm">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke login
        </Link>
      </p>
    </div>
  );
}
