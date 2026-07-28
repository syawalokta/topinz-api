import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { API_URL } from "@/lib/api";
import { CodeBlock, InlineCode } from "@/components/shared/code-block";
import { CopyButton } from "@/components/shared/copy-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = {
  title: "Getting Started",
  description:
    "Mulai menggunakan Topinz API — buat akun, simpan API key, dan kirim request pertamamu dalam hitungan menit.",
};

const firstRequestUrl = `${API_URL}/api/v1/tools/password?length=16`;

const curlSnippet = `curl -X GET "${firstRequestUrl}" \\
  -H "apikey: Tpz-username"`;

const jsSnippet = `const res = await fetch("${firstRequestUrl}", {
  headers: { apikey: "Tpz-username" }
});
const data = await res.json();
console.log(data);`;

const pySnippet = `import requests

r = requests.get(
    "${firstRequestUrl}",
    headers={"apikey": "Tpz-username"}
)
print(r.json())`;

const responseSnippet = JSON.stringify(
  {
    success: true,
    creator: "Topinz API",
    result: { password: "aB3xK9mQpL2wRz7t", length: 16 },
  },
  null,
  2
);

const steps = [
  {
    number: "01",
    title: "Buat akun",
    body: (
      <>
        Daftar gratis di{" "}
        <Link href="/register" className="text-primary hover:underline">
          halaman register
        </Link>
        . API key dibuat otomatis dengan format{" "}
        <InlineCode>Tpz-username</InlineCode>.
      </>
    ),
  },
  {
    number: "02",
    title: "Simpan API key",
    body: (
      <>
        Salin API key dari{" "}
        <Link href="/dashboard" className="text-primary hover:underline">
          dashboard
        </Link>{" "}
        dan simpan di tempat yang aman, misalnya environment variable.
      </>
    ),
  },
  {
    number: "03",
    title: "Kirim request pertama",
    body: (
      <>
        Panggil endpoint mana pun dengan menyertakan header{" "}
        <InlineCode>apikey</InlineCode>. Plan Free mendapat 30 request per
        hari.
      </>
    ),
  },
];

export default function GettingStartedPage() {
  return (
    <article className="max-w-3xl space-y-12">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Getting Started
        </h1>
        <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
          Topinz API adalah kumpulan REST API siap pakai untuk website, bot,
          aplikasi, dan automation. Panduan ini membantumu mengirim request
          pertama dalam hitungan menit — tanpa konfigurasi rumit.
        </p>
      </header>

      <section>
        <h2 className="text-base font-semibold tracking-tight">Base URL</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Semua endpoint diakses melalui base URL berikut.
        </p>
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border p-4">
          <InlineCode className="break-all">{API_URL}</InlineCode>
          <CopyButton value={API_URL} />
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold tracking-tight">
          Mulai dalam 3 langkah
        </h2>
        <ol className="mt-5 space-y-6">
          {steps.map((step) => (
            <li key={step.number} className="flex gap-4">
              <span className="pt-px font-mono text-sm text-muted-foreground/60">
                {step.number}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium">{step.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="text-base font-semibold tracking-tight">
          Request pertama
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Contoh berikut men-generate password acak sepanjang 16 karakter.
          Ganti <InlineCode>Tpz-username</InlineCode> dengan API key milikmu.
        </p>
        <Tabs defaultValue="curl" className="mt-4">
          <TabsList>
            <TabsTrigger value="curl" className="text-xs">
              cURL
            </TabsTrigger>
            <TabsTrigger value="js" className="text-xs">
              JavaScript
            </TabsTrigger>
            <TabsTrigger value="py" className="text-xs">
              Python
            </TabsTrigger>
          </TabsList>
          <TabsContent value="curl">
            <CodeBlock code={curlSnippet} language="bash" />
          </TabsContent>
          <TabsContent value="js">
            <CodeBlock code={jsSnippet} language="javascript" />
          </TabsContent>
          <TabsContent value="py">
            <CodeBlock code={pySnippet} language="python" />
          </TabsContent>
        </Tabs>

        <h3 className="mt-6 text-sm font-semibold tracking-tight">Response</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Setiap response sukses dibungkus envelope{" "}
          <InlineCode>success</InlineCode>, <InlineCode>creator</InlineCode>,
          dan <InlineCode>result</InlineCode>.
        </p>
        <CodeBlock code={responseSnippet} language="json" className="mt-3" />
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/docs/authentication"
          className="group rounded-xl border p-4 transition-colors hover:border-primary/40"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Authentication</p>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Cara autentikasi request dengan API key.
          </p>
        </Link>
        <Link
          href="/docs/errors"
          className="group rounded-xl border p-4 transition-colors hover:border-primary/40"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Error Codes</p>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Format error dan arti setiap kode status.
          </p>
        </Link>
      </section>
    </article>
  );
}
