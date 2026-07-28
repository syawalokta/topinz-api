import type { Metadata } from "next";
import { CodeBlock, InlineCode } from "@/components/shared/code-block";
import { StatusCodeBadge } from "@/components/shared/method-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = {
  title: "Error Codes",
  description:
    "Format error envelope Topinz API dan arti setiap kode status HTTP — 400, 401, 403, 404, 429, 500, dan 503.",
};

const errorEnvelope = JSON.stringify(
  {
    success: false,
    creator: "Topinz API",
    message: "Penjelasan singkat mengapa request gagal",
  },
  null,
  2
);

const example401 = JSON.stringify(
  {
    success: false,
    creator: "Topinz API",
    message: "API key tidak valid",
  },
  null,
  2
);

const example403 = JSON.stringify(
  {
    success: false,
    creator: "Topinz API",
    message: "IP 203.0.113.10 tidak terdaftar di whitelist",
  },
  null,
  2
);

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

const statusCodes = [
  {
    code: 200,
    status: "OK",
    description: "Request berhasil diproses.",
  },
  {
    code: 400,
    status: "Bad Request",
    description:
      "Parameter tidak valid atau tidak lengkap. Periksa kembali parameter yang dikirim.",
  },
  {
    code: 401,
    status: "Unauthorized",
    description:
      "API key tidak ada atau tidak valid. Pastikan header apikey terisi dengan benar.",
  },
  {
    code: 403,
    status: "Forbidden",
    description:
      "IP kamu tidak terdaftar di whitelist, atau endpoint ini membutuhkan plan Premium.",
  },
  {
    code: 404,
    status: "Not Found",
    description: "Endpoint tidak ditemukan atau belum dipublikasikan.",
  },
  {
    code: 429,
    status: "Too Many Requests",
    description:
      "Limit harian habis atau rate limit per menit endpoint terlampaui.",
  },
  {
    code: 500,
    status: "Internal Server Error",
    description: "Terjadi kesalahan di sisi server. Coba beberapa saat lagi.",
  },
  {
    code: 503,
    status: "Service Unavailable",
    description: "API sedang dalam mode maintenance.",
  },
];

export default function ErrorCodesPage() {
  return (
    <article className="max-w-3xl space-y-12">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Error Codes
        </h1>
        <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
          Semua error dikembalikan dengan envelope yang konsisten:{" "}
          <InlineCode>success</InlineCode> bernilai{" "}
          <InlineCode>false</InlineCode> dan{" "}
          <InlineCode>message</InlineCode> berisi penjelasan yang bisa
          langsung ditampilkan ke pengguna.
        </p>
      </header>

      <section>
        <h2 className="text-base font-semibold tracking-tight">
          Error envelope
        </h2>
        <CodeBlock code={errorEnvelope} language="json" className="mt-3" />
      </section>

      <section>
        <h2 className="text-base font-semibold tracking-tight">
          Kode status
        </h2>
        <div className="mt-3 overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-20">Kode</TableHead>
                <TableHead className="w-44">Status</TableHead>
                <TableHead>Deskripsi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statusCodes.map((row) => (
                <TableRow key={row.code}>
                  <TableCell>
                    <StatusCodeBadge code={row.code} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {row.status}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {row.description}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold tracking-tight">
          Contoh Response Error
        </h2>
        <div className="mt-3 space-y-4">
          <CodeBlock
            code={example401}
            language="json"
            filename="401 Unauthorized"
          />
          <CodeBlock
            code={example403}
            language="json"
            filename="403 Forbidden"
          />
          <CodeBlock
            code={example429}
            language="json"
            filename="429 Too Many Requests"
          />
        </div>
      </section>
    </article>
  );
}
