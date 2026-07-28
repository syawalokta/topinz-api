import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { site } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-dot-grid [mask-image:radial-gradient(ellipse_70%_65%_at_50%_25%,black_5%,transparent_72%)]"
      />
      <div className="container flex max-w-3xl flex-col items-center pb-20 pt-24 text-center sm:pt-28 md:pb-24 md:pt-32">
        <Reveal>
          <Link
            href="/docs"
            className="inline-flex items-center gap-1.5 rounded-full border bg-background/60 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            Introducing Topinz API v1
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Reveal>
        <Reveal delay={0.05} className="mt-6">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
            Build Faster with <span className="text-primary">Topinz API</span>
          </h1>
        </Reveal>
        <Reveal delay={0.1} className="mt-5 max-w-xl">
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            {site.description}
          </p>
        </Reveal>
        <Reveal delay={0.15} className="mt-8">
          <div className="flex flex-wrap items-center justify-center gap-3">
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
