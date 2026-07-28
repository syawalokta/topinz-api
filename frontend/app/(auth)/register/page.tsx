"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { homeForRole, useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/shared/password-input";
import { PhoneInput } from "@/components/dashboard/phone-input";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red-500">{message}</p>;
}

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [email, setEmail] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [acceptTerms, setAcceptTerms] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>(
    {}
  );
  const [submitting, setSubmitting] = React.useState(false);

  const validate = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!EMAIL_RE.test(email.trim())) {
      errors.email = "Email tidak valid";
    }
    if (!USERNAME_RE.test(username)) {
      errors.username =
        "Username harus 3–20 karakter: huruf kecil, angka, atau underscore";
    }
    if (phone.length < 8 || phone.length > 13) {
      errors.phone = "Nomor harus 8–13 digit setelah +62";
    }
    if (password.length < 8) {
      errors.password = "Password minimal 8 karakter";
    }
    if (confirmPassword !== password) {
      errors.confirmPassword = "Konfirmasi password tidak sama";
    }
    if (!acceptTerms) {
      errors.acceptTerms = "Kamu harus menyetujui syarat & ketentuan";
    }
    return errors;
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const user = await register({
        email: email.trim(),
        username,
        phone: `+62${phone}`,
        password,
        confirmPassword,
        acceptTerms,
      });
      toast.success("Registrasi berhasil");
      router.push(homeForRole(user.role));
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.fieldErrors);
        toast.error(err.message);
      } else {
        toast.error("Terjadi kesalahan. Coba lagi.");
      }
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-xl font-semibold tracking-tight">
          Create your account
        </h1>
        <p className="text-sm text-muted-foreground">
          Gratis, langsung dapat API key untuk mulai request.
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kamu@example.com"
              />
              <FieldError message={fieldErrors.email} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="dimasdev"
              />
              {fieldErrors.username ? (
                <FieldError message={fieldErrors.username} />
              ) : (
                <p className="text-xs text-muted-foreground">
                  3–20 karakter, huruf kecil, angka, underscore
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Nomor WhatsApp</Label>
              <PhoneInput id="phone" value={phone} onChange={setPhone} />
              <FieldError message={fieldErrors.phone} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                autoComplete="new-password"
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
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <PasswordInput
                id="confirmPassword"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
              <FieldError message={fieldErrors.confirmPassword} />
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-2.5">
                <Checkbox
                  id="acceptTerms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) =>
                    setAcceptTerms(checked === true)
                  }
                  className="mt-0.5"
                />
                <Label
                  htmlFor="acceptTerms"
                  className="text-sm font-normal leading-snug text-muted-foreground"
                >
                  Saya menyetujui{" "}
                  <Link
                    href="/terms"
                    className="text-foreground underline-offset-4 hover:underline"
                  >
                    Terms &amp; Conditions
                  </Link>{" "}
                  dan{" "}
                  <Link
                    href="/privacy"
                    className="text-foreground underline-offset-4 hover:underline"
                  >
                    Privacy Policy
                  </Link>
                </Label>
              </div>
              <FieldError message={fieldErrors.acceptTerms} />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" /> : null}
              Register
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Setelah register kamu langsung dapat API key{" "}
              <span className="font-mono">
                Tpz-{username || "username"}
              </span>{" "}
              dengan limit 30 request/hari.
            </p>
          </form>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        Sudah punya akun?{" "}
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
