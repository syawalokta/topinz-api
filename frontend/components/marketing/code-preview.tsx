import { Check } from "lucide-react";
import { API_URL } from "@/lib/api";
import { CodeBlock, InlineCode } from "@/components/shared/code-block";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Reveal } from "@/components/marketing/reveal";

const endpoint = `${API_URL}/api/v1/tools/password?length=16`;

interface Snippet {
  value: string;
  label: string;
  filename: string;
  code: string;
}

const snippets: Snippet[] = [
  {
    value: "curl",
    label: "cURL",
    filename: "curl",
    code: `curl "${endpoint}" \\
  -H "apikey: Tpz-username"`,
  },
  {
    value: "javascript",
    label: "JavaScript",
    filename: "request.js",
    code: `const res = await fetch(
  "${endpoint}",
  { headers: { apikey: "Tpz-username" } }
);

const data = await res.json();
console.log(data.result.password);`,
  },
  {
    value: "python",
    label: "Python",
    filename: "request.py",
    code: `import requests

res = requests.get(
    "${endpoint}",
    headers={"apikey": "Tpz-username"},
)

print(res.json()["result"]["password"])`,
  },
];

const responseCode = `{
  "success": true,
  "creator": "Topinz API",
  "result": {
    "password": "uK4xTz7mQ9rWv2Nb",
    "length": 16
  }
}`;

const checklist = [
  "Autentikasi cukup dengan satu header apikey",
  "Envelope JSON konsisten di seluruh endpoint",
  "Contoh request siap salin untuk cURL, JavaScript, dan Python",
];

export function CodePreview() {
  return (
    <section className="container py-20 md:py-24">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">
            Developer Experience
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            One API key, every endpoint
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Tidak perlu SDK khusus atau konfigurasi OAuth yang rumit. Kirim
            request HTTP biasa dengan header <InlineCode>apikey</InlineCode>,
            dan setiap endpoint membalas dengan struktur JSON yang sama —
            mudah di-parse di bahasa apa pun.
          </p>
          <ul className="mt-6 space-y-3">
            {checklist.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.1}>
          <Tabs defaultValue="curl">
            <TabsList>
              {snippets.map((snippet) => (
                <TabsTrigger key={snippet.value} value={snippet.value}>
                  {snippet.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {snippets.map((snippet) => (
              <TabsContent key={snippet.value} value={snippet.value}>
                <CodeBlock code={snippet.code} filename={snippet.filename} />
              </TabsContent>
            ))}
          </Tabs>
          <CodeBlock
            code={responseCode}
            filename="response.json"
            className="mt-3"
          />
        </Reveal>
      </div>
    </section>
  );
}
