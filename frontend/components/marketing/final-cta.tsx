import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";

export function FinalCta() {
  return (
    <section className="border-t">
      <div className="container py-20 md:py-24">
        <Reveal className="mx-auto flex max-w-xl flex-col items-center text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Mulai integrasi dalam hitungan menit
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Buat akun gratis, salin API key Anda, dan kirim request pertama
            hari ini.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/register">Get Started</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/docs">Documentation</Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
