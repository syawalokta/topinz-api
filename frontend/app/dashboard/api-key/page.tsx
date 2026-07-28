"use client";

import * as React from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { API_URL, ApiError, apiPut } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { maskApiKey } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { CodeBlock, InlineCode } from "@/components/shared/code-block";
import { CopyButton } from "@/components/shared/copy-button";
import { PageHeader } from "@/components/shared/page-header";

export default function ApiKeyPage() {
  const { user, setUser, refresh } = useAuth();
  const [visible, setVisible] = React.useState(false);
  const [resetting, setResetting] = React.useState(false);

  const handleReset = async () => {
    if (resetting) return;
    setResetting(true);
    try {
      const data = await apiPut<{ apiKey: string }>("/apikey/reset");
      if (user) setUser({ ...user, apiKey: data.apiKey });
      toast.success("API key berhasil direset");
      await refresh();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Gagal mereset API key"
      );
    } finally {
      setResetting(false);
    }
  };

  if (!user) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="API Key"
          description="Kelola key untuk mengakses Topinz API."
        />
        <Skeleton className="h-[160px] rounded-xl" />
        <Skeleton className="h-[220px] rounded-xl" />
        <Skeleton className="h-[140px] rounded-xl" />
      </div>
    );
  }

  const curl = [
    `curl "${API_URL}/api/v1/tools/password?length=16" \\`,
    `  -H "apikey: ${user.apiKey}"`,
  ].join("\n");

  return (
    <div className="space-y-6">
      <PageHeader
        title="API Key"
        description="Kelola key untuk mengakses Topinz API."
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">API key kamu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-1.5">
            <code className="min-w-0 flex-1 break-all rounded-lg bg-muted px-3 py-2 font-mono text-sm">
              {visible ? user.apiKey : maskApiKey(user.apiKey)}
            </code>
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? "Sembunyikan API key" : "Tampilkan API key"}
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {visible ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
            </button>
            <CopyButton value={user.apiKey} />
          </div>
          <p className="text-xs text-muted-foreground">
            Gunakan header <InlineCode className="text-xs">apikey</InlineCode>{" "}
            pada setiap request. Jangan bagikan key ini ke siapa pun.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Cara pakai</CardTitle>
          <CardDescription>
            Contoh request dengan API key kamu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CodeBlock language="bash" code={curl} />
        </CardContent>
      </Card>

      <Card className="border-red-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Reset API Key</CardTitle>
          <CardDescription>
            Key lama langsung nonaktif — semua aplikasi yang memakainya harus
            diperbarui dengan key baru.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={resetting}>
                {resetting ? <Loader2 className="animate-spin" /> : null}
                Reset API Key
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset API key?</AlertDialogTitle>
                <AlertDialogDescription>
                  Key lama langsung nonaktif dan tidak bisa digunakan lagi.
                  Tindakan ini tidak dapat dibatalkan.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => void handleReset()}
                >
                  Reset key
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
