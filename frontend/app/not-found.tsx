import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-sm text-muted-foreground">404</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">
        Halaman tidak ditemukan
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Halaman yang kamu cari tidak tersedia atau sudah dipindahkan.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Button asChild>
          <Link href="/">Kembali ke Beranda</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/docs">Buka Dokumentasi</Link>
        </Button>
      </div>
    </div>
  );
}
