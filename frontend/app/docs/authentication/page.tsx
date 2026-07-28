import type { Metadata } from "next";
import Link from "next/link";
import { API_URL } from "@/lib/api";
import { CodeBlock, InlineCode } from "@/components/shared/code-block";

export const metadata: Metadata = {
  title: "Authentication",
  description:
    "Cara autentikasi request ke Topinz API dengan API key — via header apikey, query parameter, dan whitelist IP.",
};

const headerSnippet = `curl -X GET "${API_URL}/api/v1/tools/uuid" \\
  -H "apikey: Tpz-username"`;

const querySnippet = `curl -X GET "${API_URL}/api/v1/tools/uuid?apikey=Tpz-username"`;

const forbiddenSnippet = JSON.stringify(
  {
    success: false,
    creator: "Topinz API",
    message: "IP kamu tidak terdaftar di whitelist",
  },
  null,
  2
);

export default function AuthenticationPage() {
  return (
    <article className="max-w-3xl space-y-12">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Authentication
        </h1>
        <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
          Semua request ke <InlineCode>/api/v1/*</InlineCode> diautentikasi
          dengan API key. Request tanpa key yang valid akan ditolak dengan
          status 401.
        </p>
      </header>

      <section>
        <h2 className="text-base font-semibold tracking-tight">API Key</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Setiap akun mendapat satu API key dengan format{" "}
          <InlineCode>Tpz-username</InlineCode>, dibuat otomatis saat
          registrasi. Kamu bisa melihat dan me-reset key ini kapan saja dari{" "}
          <Link href="/dashboard" className="text-primary hover:underline">
            dashboard
          </Link>
          . Setelah reset, key lama langsung tidak berlaku.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold tracking-tight">
          Menggunakan API Key
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Cara yang disarankan adalah mengirim key lewat header{" "}
          <InlineCode>apikey</InlineCode>:
        </p>
        <CodeBlock code={headerSnippet} language="bash" className="mt-3" />
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Alternatifnya, key bisa dikirim sebagai query parameter{" "}
          <InlineCode>?apikey=</InlineCode> — praktis untuk uji cepat di
          browser, tetapi hindari di production karena key ikut tercatat di
          log dan URL:
        </p>
        <CodeBlock code={querySnippet} language="bash" className="mt-3" />
        <div className="mt-4 rounded-xl border bg-muted/50 px-4 py-3 text-[13px] leading-relaxed text-muted-foreground">
          Header <InlineCode>x-api-key</InlineCode> juga didukung sebagai
          alias dari <InlineCode>apikey</InlineCode>.
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold tracking-tight">
          Whitelist IP
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Whitelist IP membatasi dari mana API key kamu boleh dipakai.
          Kelolanya dari dashboard, dengan perilaku berikut:
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-muted-foreground/50">
          <li>Whitelist kosong — request diizinkan dari semua IP.</li>
          <li>
            Whitelist terisi — hanya IP yang terdaftar yang diizinkan; IP lain
            menerima 403.
          </li>
          <li>
            <InlineCode>0.0.0.0</InlineCode> selalu diblokir dan tidak bisa
            didaftarkan.
          </li>
        </ul>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Contoh response saat IP tidak diizinkan:
        </p>
        <CodeBlock
          code={forbiddenSnippet}
          language="json"
          filename="403 Forbidden"
          className="mt-3"
        />
      </section>

      <section>
        <h2 className="text-base font-semibold tracking-tight">Keamanan</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-muted-foreground/50">
          <li>
            Jangan pernah commit API key ke repository, termasuk repository
            private.
          </li>
          <li>Reset API key segera jika kamu curiga key sudah bocor.</li>
          <li>
            Simpan key di environment variable, bukan hardcoded di source
            code.
          </li>
          <li>Aktifkan whitelist IP untuk penggunaan di production.</li>
        </ul>
      </section>
    </article>
  );
}
