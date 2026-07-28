"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { ApiError, apiPost, apiPut } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import type {
  ApiEndpoint,
  Category,
  EndpointParam,
  HttpMethod,
  ResponseCode,
} from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const PARAM_TYPES = ["string", "number", "boolean"] as const;
const PARAM_LOCATIONS: EndpointParam["in"][] = [
  "query",
  "body",
  "path",
  "header",
];

type EndpointStatus = ApiEndpoint["status"];

interface ResponseCodeRow {
  code: string;
  description: string;
}

const DEFAULT_RESPONSE_CODES: ResponseCodeRow[] = [
  { code: "200", description: "Berhasil" },
  { code: "400", description: "Parameter tidak valid" },
  { code: "401", description: "API key tidak valid" },
  { code: "403", description: "Akses ditolak (IP / premium)" },
  { code: "429", description: "Limit request terlampaui" },
];

function errorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : "Terjadi kesalahan";
}

function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

interface EndpointFormProps {
  initial?: ApiEndpoint;
  onSaved: () => void;
}

export function EndpointForm({ initial, onSaved }: EndpointFormProps) {
  const router = useRouter();
  const { data: categoriesData } = useApi<{ items: Category[] }>(
    "/categories?all=true"
  );
  const categories = categoriesData?.items;

  // Informasi dasar
  const [name, setName] = React.useState(initial?.name ?? "");
  const [category, setCategory] = React.useState<string>(
    initial
      ? typeof initial.category === "object" && initial.category !== null
        ? initial.category._id
        : initial.category
      : ""
  );
  const [method, setMethod] = React.useState<HttpMethod>(
    initial?.method ?? "GET"
  );
  const [path, setPath] = React.useState(initial?.path ?? "");
  const [shortDescription, setShortDescription] = React.useState(
    initial?.shortDescription ?? ""
  );
  const [description, setDescription] = React.useState(
    initial?.description ?? ""
  );

  // Perilaku
  const [status, setStatus] = React.useState<EndpointStatus>(
    initial?.status ?? "active"
  );
  const [premiumOnly, setPremiumOnly] = React.useState(
    initial?.premiumOnly ?? false
  );
  const [rateLimit, setRateLimit] = React.useState(
    String(initial?.rateLimit ?? 60)
  );
  const [requestCost, setRequestCost] = React.useState(
    String(initial?.requestCost ?? 1)
  );
  const [tagsInput, setTagsInput] = React.useState(
    initial?.tags.join(", ") ?? ""
  );

  // Parameter
  const [params, setParams] = React.useState<EndpointParam[]>(
    initial?.params ?? []
  );

  // Contoh & response
  const [exampleRequest, setExampleRequest] = React.useState(
    initial?.exampleRequest ?? ""
  );
  const [exampleResponse, setExampleResponse] = React.useState(
    initial?.exampleResponse ?? ""
  );
  const [responseCodes, setResponseCodes] = React.useState<ResponseCodeRow[]>(
    initial
      ? initial.responseCodes.map((rc) => ({
          code: String(rc.code),
          description: rc.description,
        }))
      : DEFAULT_RESPONSE_CODES
  );

  const [saving, setSaving] = React.useState(false);

  const tags = parseTags(tagsInput);

  const updateParam = (index: number, patch: Partial<EndpointParam>) => {
    setParams((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...patch } : p))
    );
  };

  const updateResponseCode = (
    index: number,
    patch: Partial<ResponseCodeRow>
  ) => {
    setResponseCodes((prev) =>
      prev.map((rc, i) => (i === index ? { ...rc, ...patch } : rc))
    );
  };

  const prettifyExampleResponse = () => {
    try {
      const parsed: unknown = JSON.parse(exampleResponse);
      setExampleResponse(JSON.stringify(parsed, null, 2));
    } catch {
      // keep raw text if it's not valid JSON
    }
  };

  const save = async () => {
    if (!name.trim()) {
      toast.error("Nama endpoint wajib diisi");
      return;
    }
    if (!category) {
      toast.error("Pilih kategori terlebih dahulu");
      return;
    }
    if (!path.trim().startsWith("/api/v1/")) {
      toast.error("Path harus diawali /api/v1/");
      return;
    }

    const payload: {
      name: string;
      category: string;
      method: HttpMethod;
      path: string;
      shortDescription: string;
      description: string;
      status: EndpointStatus;
      premiumOnly: boolean;
      rateLimit: number;
      requestCost: number;
      tags: string[];
      params: EndpointParam[];
      exampleRequest: string;
      exampleResponse: string;
      responseCodes: ResponseCode[];
    } = {
      name: name.trim(),
      category,
      method,
      path: path.trim(),
      shortDescription: shortDescription.trim(),
      description: description.trim(),
      status,
      premiumOnly,
      rateLimit: Number(rateLimit) || 0,
      requestCost: Number(requestCost) || 1,
      tags,
      params: params
        .filter((p) => p.name.trim() !== "")
        .map((p) => ({ ...p, name: p.name.trim() })),
      exampleRequest: exampleRequest.trim(),
      exampleResponse,
      responseCodes: responseCodes
        .filter((rc) => rc.code.trim() !== "")
        .map((rc) => ({
          code: Number(rc.code),
          description: rc.description.trim(),
        })),
    };

    setSaving(true);
    try {
      if (initial) {
        await apiPut(`/endpoint/${initial._id}`, payload);
        toast.success("Endpoint diperbarui");
      } else {
        await apiPost("/endpoint", payload);
        toast.success("Endpoint ditambahkan");
      }
      onSaved();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informasi Dasar</CardTitle>
          <CardDescription>
            Identitas endpoint yang tampil di katalog dan dokumentasi.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ep-name">Nama</Label>
              <Input
                id="ep-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Password Generator"
              />
            </div>
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {(categories ?? []).map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
            <div className="space-y-2">
              <Label>Method</Label>
              <Select
                value={method}
                onValueChange={(value) => setMethod(value as HttpMethod)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ep-path">Path</Label>
              <Input
                id="ep-path"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="/api/v1/tools/example"
                className="font-mono text-[13px]"
              />
              <p className="text-xs text-muted-foreground">
                Harus diawali <span className="font-mono">/api/v1/</span>
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ep-short">Short Description</Label>
            <Input
              id="ep-short"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Generate password acak yang aman."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ep-description">Description</Label>
            <Textarea
              id="ep-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Penjelasan lengkap endpoint untuk halaman dokumentasi."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Perilaku</CardTitle>
          <CardDescription>
            Status, akses, dan batasan pemakaian endpoint.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as EndpointStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="deprecated">Deprecated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ep-ratelimit">Rate Limit</Label>
              <Input
                id="ep-ratelimit"
                type="number"
                min={0}
                value={rateLimit}
                onChange={(e) => setRateLimit(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">request per menit</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ep-cost">Request Cost</Label>
              <Input
                id="ep-cost"
                type="number"
                min={1}
                value={requestCost}
                onChange={(e) => setRequestCost(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                dihitung dari limit harian
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">Premium Only</p>
              <p className="text-xs text-muted-foreground">
                Hanya dapat diakses oleh user premium.
              </p>
            </div>
            <Switch
              checked={premiumOnly}
              onCheckedChange={setPremiumOnly}
              aria-label="Premium only"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ep-tags">Tags</Label>
            <Input
              id="ep-tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="tools, generator, security"
            />
            <p className="text-xs text-muted-foreground">
              Pisahkan dengan koma.
            </p>
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Parameter</CardTitle>
          <CardDescription>
            Parameter yang diterima endpoint, untuk tabel dokumentasi.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {params.length === 0 ? (
            <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
              Belum ada parameter.
            </p>
          ) : (
            params.map((param, index) => (
              <div
                key={index}
                className="grid gap-2 rounded-lg border p-3 lg:grid-cols-[1fr_120px_120px_1.4fr_auto_32px] lg:items-center"
              >
                <Input
                  value={param.name}
                  onChange={(e) => updateParam(index, { name: e.target.value })}
                  placeholder="Nama"
                  className="font-mono text-[13px]"
                  aria-label="Nama parameter"
                />
                <Select
                  value={param.type}
                  onValueChange={(value) => updateParam(index, { type: value })}
                >
                  <SelectTrigger aria-label="Tipe parameter">
                    <SelectValue placeholder="Tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    {PARAM_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={param.in}
                  onValueChange={(value) =>
                    updateParam(index, { in: value as EndpointParam["in"] })
                  }
                >
                  <SelectTrigger aria-label="Lokasi parameter">
                    <SelectValue placeholder="In" />
                  </SelectTrigger>
                  <SelectContent>
                    {PARAM_LOCATIONS.map((loc) => (
                      <SelectItem key={loc} value={loc}>
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={param.description}
                  onChange={(e) =>
                    updateParam(index, { description: e.target.value })
                  }
                  placeholder="Deskripsi"
                  aria-label="Deskripsi parameter"
                />
                <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-muted-foreground">
                  <Checkbox
                    checked={param.required}
                    onCheckedChange={(checked) =>
                      updateParam(index, { required: checked === true })
                    }
                    aria-label="Parameter wajib"
                  />
                  Required
                </label>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 justify-self-end text-muted-foreground"
                  onClick={() =>
                    setParams((prev) => prev.filter((_, i) => i !== index))
                  }
                  aria-label="Hapus parameter"
                >
                  <X />
                </Button>
              </div>
            ))
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setParams((prev) => [
                ...prev,
                {
                  name: "",
                  type: "string",
                  required: false,
                  description: "",
                  in: "query",
                },
              ])
            }
          >
            <Plus />
            Tambah Parameter
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contoh &amp; Response</CardTitle>
          <CardDescription>
            Contoh pemakaian dan daftar kode response.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ep-example-request">Example Request</Label>
            <Input
              id="ep-example-request"
              value={exampleRequest}
              onChange={(e) => setExampleRequest(e.target.value)}
              placeholder="/api/v1/tools/example?text=halo"
              className="font-mono text-[13px]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ep-example-response">Example Response</Label>
            <Textarea
              id="ep-example-response"
              value={exampleResponse}
              onChange={(e) => setExampleResponse(e.target.value)}
              onBlur={prettifyExampleResponse}
              placeholder={'{\n  "result": "…"\n}'}
              rows={8}
              className="font-mono text-[13px]"
            />
            <p className="text-xs text-muted-foreground">
              JSON akan dirapikan otomatis saat valid.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Response Codes</Label>
            <div className="space-y-2">
              {responseCodes.map((rc, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[96px_1fr_32px] items-center gap-2"
                >
                  <Input
                    type="number"
                    value={rc.code}
                    onChange={(e) =>
                      updateResponseCode(index, { code: e.target.value })
                    }
                    className="font-mono text-[13px]"
                    aria-label="Kode response"
                  />
                  <Input
                    value={rc.description}
                    onChange={(e) =>
                      updateResponseCode(index, {
                        description: e.target.value,
                      })
                    }
                    placeholder="Deskripsi"
                    aria-label="Deskripsi response"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={() =>
                      setResponseCodes((prev) =>
                        prev.filter((_, i) => i !== index)
                      )
                    }
                    aria-label="Hapus kode response"
                  >
                    <X />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setResponseCodes((prev) => [
                  ...prev,
                  { code: "", description: "" },
                ])
              }
            >
              <Plus />
              Tambah Kode
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-4 z-10 flex items-center justify-end gap-2 rounded-xl border bg-background/95 p-3 shadow-soft backdrop-blur">
        <Button variant="outline" onClick={() => router.back()} disabled={saving}>
          Batal
        </Button>
        <Button onClick={() => void save()} disabled={saving}>
          {saving ? <Loader2 className="animate-spin" /> : null}
          Simpan
        </Button>
      </div>
    </div>
  );
}
