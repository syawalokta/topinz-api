import type { Metadata } from "next";
import { Check, Minus } from "lucide-react";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { FaqList, type FaqItem } from "@/components/marketing/faq";
import { FinalCta } from "@/components/marketing/final-cta";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Mulai gratis dengan 30 request per hari, atau upgrade ke Premium untuk 5.000 request per hari dan akses endpoint premium.",
};

interface ComparisonRow {
  feature: string;
  free: string | boolean;
  premium: string | boolean;
}

const comparison: ComparisonRow[] = [
  { feature: "Request per hari", free: "30", premium: "5.000" },
  { feature: "Endpoint premium", free: false, premium: true },
  { feature: "Whitelist IP", free: false, premium: true },
  { feature: "Rate limit", free: "Standar", premium: "Lebih tinggi" },
  { feature: "Support", free: "Komunitas", premium: "Prioritas 24/7" },
];

const pricingFaq: FaqItem[] = [
  {
    question: "Bagaimana cara membayar paket Premium?",
    answer:
      "Setelah mendaftar, ajukan upgrade melalui dashboard dan selesaikan pembayaran sesuai instruksi. Akun Anda diaktifkan ke Premium segera setelah pembayaran dikonfirmasi.",
  },
  {
    question: "Apakah kuota yang tidak terpakai bisa diakumulasi?",
    answer:
      "Tidak. Kuota harian di-reset setiap tengah malam dan tidak dibawa ke hari berikutnya, baik pada paket Free maupun Premium.",
  },
  {
    question: "Apa yang terjadi saat masa Premium berakhir?",
    answer:
      "Akun otomatis kembali ke paket Free dengan limit 30 request per hari. API key dan seluruh data tetap tersimpan, dan Anda dapat memperpanjang kapan saja.",
  },
];

function ComparisonCell({ value }: { value: string | boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check aria-label="Termasuk" className="mx-auto h-4 w-4 text-primary" />
    ) : (
      <Minus
        aria-label="Tidak termasuk"
        className="mx-auto h-4 w-4 text-muted-foreground/40"
      />
    );
  }
  return <span className="tabular-nums">{value}</span>;
}

export default function PricingPage() {
  return (
    <>
      <section className="container pt-16 md:pt-24">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Pricing
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Mulai gratis tanpa kartu kredit. Satu harga saat Anda siap naik ke
            production, tanpa biaya tersembunyi.
          </p>
        </div>
        <PricingCards className="mx-auto mt-12 max-w-3xl" />
      </section>

      <section className="container py-20 md:py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-lg font-semibold tracking-tight">
            Compare plans
          </h2>
          <div className="mt-5 overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-5 py-3.5 text-left font-medium">Fitur</th>
                  <th className="w-28 px-4 py-3.5 text-center font-medium sm:w-36">
                    Free
                  </th>
                  <th className="w-28 px-4 py-3.5 text-center font-medium sm:w-36">
                    Premium
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {comparison.map((row) => (
                  <tr key={row.feature}>
                    <td className="px-5 py-3.5">{row.feature}</td>
                    <td className="px-4 py-3.5 text-center text-muted-foreground">
                      <ComparisonCell value={row.free} />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <ComparisonCell value={row.premium} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="container pb-20 md:pb-24">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-lg font-semibold tracking-tight">FAQ</h2>
          <div className="mt-2">
            <FaqList items={pricingFaq} />
          </div>
        </div>
      </section>

      <FinalCta />
    </>
  );
}
