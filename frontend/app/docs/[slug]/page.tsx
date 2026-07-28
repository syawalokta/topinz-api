"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { API_URL } from "@/lib/api";
import { buildSamples } from "@/lib/code-samples";
import { useApi } from "@/lib/hooks";
import type { ApiEndpoint } from "@/lib/types";
import { CodeBlock, InlineCode } from "@/components/shared/code-block";
import { CopyButton } from "@/components/shared/copy-button";
import { EmptyState } from "@/components/shared/empty-state";
import {
  MethodBadge,
  StatusCodeBadge,
} from "@/components/shared/method-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const BODY_METHODS: ReadonlyArray<ApiEndpoint["method"]> = [
  "POST",
  "PUT",
  "PATCH",
];

const statusLabels: Record<ApiEndpoint["status"], string> = {
  active: "Active",
  maintenance: "Maintenance",
  deprecated: "Deprecated",
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-sm font-semibold tracking-tight">{children}</h2>
  );
}

function EndpointSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-3 w-44" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="flex items-center gap-3 rounded-xl border bg-muted/50 p-3">
        <Skeleton className="h-5 w-[44px]" />
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-7 w-7" />
      </div>
      <div className="xl:grid xl:grid-cols-[1fr_420px] xl:gap-8">
        <div className="min-w-0 space-y-8">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
        <div className="mt-8 space-y-4 xl:mt-0">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-[280px] w-full rounded-xl" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function EndpointDocPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { data, error, loading } = useApi<{ endpoint: ApiEndpoint }>(
    `/docs/endpoint/${slug}`
  );
  const endpoint = data?.endpoint ?? null;

  const samples = useMemo(
    () => (endpoint ? buildSamples(endpoint, API_URL) : []),
    [endpoint]
  );

  const prettyResponse = useMemo(() => {
    if (!endpoint) return "";
    try {
      return JSON.stringify(JSON.parse(endpoint.exampleResponse), null, 2);
    } catch {
      return endpoint.exampleResponse;
    }
  }, [endpoint]);

  if (loading) return <EndpointSkeleton />;

  if (error || !endpoint) {
    return (
      <EmptyState
        title="Endpoint tidak ditemukan"
        description={
          error ??
          "Endpoint yang kamu cari tidak tersedia atau belum dipublikasikan."
        }
        action={
          <Button asChild size="sm">
            <Link href="/docs">Kembali ke Docs</Link>
          </Button>
        }
      />
    );
  }

  const categoryName =
    typeof endpoint.category === "string" ? null : endpoint.category.name;
  const fullUrl = API_URL + endpoint.path;
  const hasBody =
    BODY_METHODS.includes(endpoint.method) &&
    endpoint.params.some((param) => param.in === "body");
  const description = endpoint.description || endpoint.shortDescription;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
          <Link href="/docs" className="transition-colors hover:text-foreground">
            Docs
          </Link>
          {categoryName ? <span> / {categoryName}</span> : null}
          <span> / </span>
          <span className="text-foreground">{endpoint.name}</span>
        </nav>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {endpoint.name}
          </h1>
          {endpoint.premiumOnly ? (
            <Badge variant="info">Premium</Badge>
          ) : null}
          {endpoint.status === "maintenance" ? (
            <Badge variant="warning">Maintenance</Badge>
          ) : null}
        </div>

        {description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-3 rounded-xl border bg-muted/50 p-3">
        <MethodBadge method={endpoint.method} className="shrink-0" />
        <code className="min-w-0 break-all font-mono text-[13px]">
          {fullUrl}
        </code>
        <CopyButton value={fullUrl} className="ml-auto" />
      </div>

      <div className="xl:grid xl:grid-cols-[1fr_420px] xl:gap-8">
        {/* Left column — reference tables */}
        <div className="min-w-0 space-y-8">
          <section>
            <SectionTitle>Detail</SectionTitle>
            <dl className="grid grid-cols-2 gap-4 rounded-xl border p-4 sm:grid-cols-4">
              <div>
                <dt className="text-xs text-muted-foreground">Rate Limit</dt>
                <dd className="mt-1 text-sm font-medium">
                  {endpoint.rateLimit} req/menit
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Cost</dt>
                <dd className="mt-1 text-sm font-medium">
                  {endpoint.requestCost}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Kategori</dt>
                <dd className="mt-1 text-sm font-medium">
                  {categoryName ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Status</dt>
                <dd className="mt-1 text-sm font-medium">
                  {statusLabels[endpoint.status]}
                </dd>
              </div>
            </dl>
          </section>

          <section>
            <SectionTitle>Headers</SectionTitle>
            <div className="overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Header</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Deskripsi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-mono text-[13px]">
                      apikey
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      string
                    </TableCell>
                    <TableCell>
                      <Badge variant="success" className="px-1.5 text-[10px]">
                        required
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      API key kamu
                    </TableCell>
                  </TableRow>
                  {hasBody ? (
                    <TableRow>
                      <TableCell className="font-mono text-[13px]">
                        Content-Type
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        string
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="success"
                          className="px-1.5 text-[10px]"
                        >
                          required
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <InlineCode>application/json</InlineCode>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          </section>

          <section>
            <SectionTitle>Parameters</SectionTitle>
            {endpoint.params.length > 0 ? (
              <div className="overflow-hidden rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Nama</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead>In</TableHead>
                      <TableHead>Required</TableHead>
                      <TableHead>Deskripsi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {endpoint.params.map((param) => (
                      <TableRow key={`${param.in}-${param.name}`}>
                        <TableCell className="font-mono text-[13px]">
                          {param.name}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {param.type}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className="px-1.5 text-[10px]"
                          >
                            {param.in}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {param.required ? (
                            <Badge
                              variant="success"
                              className="px-1.5 text-[10px]"
                            >
                              required
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              optional
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {param.description}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Endpoint ini tidak memerlukan parameter.
              </p>
            )}
          </section>

          <section>
            <SectionTitle>Response Codes</SectionTitle>
            {endpoint.responseCodes.length > 0 ? (
              <div className="overflow-hidden rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-20">Kode</TableHead>
                      <TableHead>Deskripsi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {endpoint.responseCodes.map((responseCode, index) => (
                      <TableRow key={`${responseCode.code}-${index}`}>
                        <TableCell>
                          <StatusCodeBadge code={responseCode.code} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {responseCode.description}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Tidak ada dokumentasi kode response untuk endpoint ini.
              </p>
            )}
          </section>
        </div>

        {/* Right column — request samples + example response */}
        <div className="mt-8 min-w-0 space-y-4 self-start xl:sticky xl:top-20 xl:mt-0">
          <Tabs defaultValue="cURL">
            <div className="scrollbar-thin overflow-x-auto pb-1">
              <TabsList className="w-max">
                {samples.map((sample) => (
                  <TabsTrigger
                    key={sample.label}
                    value={sample.label}
                    className="px-2.5 text-xs"
                  >
                    {sample.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            {samples.map((sample) => (
              <TabsContent key={sample.label} value={sample.label}>
                <CodeBlock
                  code={sample.code}
                  language={sample.language}
                  filename={sample.label}
                  maxHeight={360}
                />
              </TabsContent>
            ))}
          </Tabs>

          <div>
            <SectionTitle>Response</SectionTitle>
            <CodeBlock code={prettyResponse} language="json" maxHeight={300} />
          </div>
        </div>
      </div>
    </div>
  );
}
