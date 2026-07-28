import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import type { HttpMethod } from "@/lib/types";
import { MethodBadge } from "@/components/shared/method-badge";
import { Reveal } from "@/components/marketing/reveal";

interface SampleEndpoint {
  method: HttpMethod;
  path: string;
  description: string;
}

const endpoints: SampleEndpoint[] = [
  {
    method: "GET",
    path: "/api/v1/tools/password",
    description: "Generate password acak yang aman",
  },
  {
    method: "POST",
    path: "/api/v1/tools/hash",
    description: "Hash teks dengan berbagai algoritma",
  },
  {
    method: "GET",
    path: "/api/v1/tools/qrcode",
    description: "Buat QR code dari teks atau URL",
  },
  {
    method: "GET",
    path: "/api/v1/text/slug",
    description: "Ubah teks menjadi slug URL",
  },
  {
    method: "GET",
    path: "/api/v1/utility/myip",
    description: "Deteksi alamat IP publik pemanggil",
  },
];

/** Compact strip previewing a handful of documented endpoints. */
export function DocsPreview() {
  return (
    <section className="container py-20 md:py-24">
      <Reveal className="mx-auto max-w-3xl">
        <div className="overflow-hidden rounded-xl border bg-card shadow-soft">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <p className="text-sm font-medium">Documentation</p>
            <Link
              href="/docs"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Lihat semua
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y">
            {endpoints.map((endpoint) => (
              <Link
                key={endpoint.path}
                href="/docs"
                className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted/50"
              >
                <MethodBadge method={endpoint.method} />
                <code className="font-mono text-[13px]">{endpoint.path}</code>
                <span className="hidden flex-1 truncate text-right text-sm text-muted-foreground sm:block">
                  {endpoint.description}
                </span>
                <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 sm:ml-0" />
              </Link>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
