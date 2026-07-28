import type { Metadata } from "next";
import { CodeBlock, InlineCode } from "@/components/shared/code-block";

export const metadata: Metadata = {
  title: "Rate Limit",
  description:
    "Kuota harian per plan, request cost, dan rate limit per endpoint di Topinz API — plus tips menghadapinya.",
};

const example429 = JSON.stringify(
  {
    success: false,
    creator: "Topinz API",
    message: "Limit harian tercapai (30/30). Coba lagi setelah reset.",
    limit: 30,
    remaining: 0,
    resetAt: "2026-07-29T00:00:00+07:00",
  },
  null,
  2
);

const dailyLimits = [
  { plan: "Free", limit: "30 request/hari" },
  { plan: "Premium", limit: "5.000 request/hari" },
  { plan: "Admin", limit: "Tanpa batas" },
];

export default function RateLimitPage() {
  return (
    <article className="max-w-3xl space-y-12">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Rate Limit
        </h1>
        <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
          Pemakaian API dibatasi di dua lapis: kuota harian per akun dan rate
          limit per menit di setiap endpoint. Keduanya menjaga API tetap
          cepat dan adil untuk semua pengguna.
        </p>
      </header>

      <section>
        <h2 className="text-base font-semibold tracking-tight">
          Limit Harian
        </h2>
        <div className="mt-3 divide-y rounded-xl border">
          {dailyLimits.map((row) => (
            <div
              key={row.plan}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <span className="text-sm font-medium">{row.plan}</span>
              <span className="text-sm text-muted-foreground">
                {row.limit}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Kuota di-reset setiap hari pukul 00:00 WIB. Sisa kuota bisa
          dipantau dari dashboard.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold tracking-tight">
          Request Cost
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Setiap request mengurangi kuota harian sesuai request cost
          endpoint. Sebagian besar endpoint berbiaya 1, tetapi endpoint yang
          berat — misalnya AI atau downloader — bisa berbiaya lebih dari 1.
          Cost setiap endpoint tercantum di halaman detailnya.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold tracking-tight">
          Rate Limit per Endpoint
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Selain kuota harian, setiap endpoint punya rate limit per menit —
          default 60 request/menit per pengguna. Nilai spesifiknya tertera di
          bagian Detail pada halaman setiap endpoint. Melebihi batas ini
          menghasilkan response 429.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold tracking-tight">
          Response 429
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Saat kuota harian habis atau rate limit terlampaui, API merespons
          dengan status 429:
        </p>
        <CodeBlock
          code={example429}
          language="json"
          filename="429 Too Many Requests"
          className="mt-3"
        />
      </section>

      <section>
        <h2 className="text-base font-semibold tracking-tight">Tips</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-muted-foreground/50">
          <li>
            Terapkan exponential backoff saat menerima 429 — jangan langsung
            retry.
          </li>
          <li>
            Cache hasil response untuk data yang jarang berubah agar kuota
            tidak cepat habis.
          </li>
          <li>
            Periksa field <InlineCode>resetAt</InlineCode> pada response 429
            untuk tahu kapan kuota pulih.
          </li>
          <li>Sebarkan request secara merata dan hindari burst.</li>
        </ul>
      </section>
    </article>
  );
}
