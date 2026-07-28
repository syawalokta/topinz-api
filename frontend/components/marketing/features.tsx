import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Gauge,
  Network,
  ShieldCheck,
  Terminal,
  Zap,
} from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";
import { SectionHeading } from "@/components/marketing/section-heading";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: BookOpen,
    title: "Dokumentasi Lengkap",
    description:
      "Setiap endpoint memiliki daftar parameter, contoh request, dan contoh response yang siap disalin.",
  },
  {
    icon: Zap,
    title: "Fast Response",
    description:
      "Infrastruktur yang dioptimalkan untuk latensi rendah dengan waktu response yang konsisten.",
  },
  {
    icon: ShieldCheck,
    title: "Secure API",
    description:
      "Autentikasi API key per akun, password ter-hash bcrypt, dan seluruh trafik terenkripsi.",
  },
  {
    icon: Network,
    title: "Whitelist IP",
    description:
      "Batasi penggunaan API key hanya dari alamat IP yang Anda daftarkan di dashboard.",
  },
  {
    icon: Gauge,
    title: "Rate Limit",
    description:
      "Kuota harian dan limit per menit yang transparan, dengan response 429 yang jelas saat terlampaui.",
  },
  {
    icon: Terminal,
    title: "Developer Friendly",
    description:
      "Envelope JSON konsisten, error code standar, dan contoh kode untuk berbagai bahasa pemrograman.",
  },
];

export function Features() {
  return (
    <section className="container py-20 md:py-24">
      <Reveal>
        <SectionHeading
          overline="Features"
          title="Built for production"
          description="Fondasi API yang stabil untuk trafik nyata, dengan tooling yang membuat integrasi terasa ringan."
        />
      </Reveal>
      <div className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <Reveal key={feature.title} delay={index * 0.05}>
            <div className="h-full rounded-xl border bg-card p-6 transition-colors hover:border-primary/30">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <feature.icon className="h-4 w-4" />
              </div>
              <h3 className="mt-4 text-sm font-medium">{feature.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
