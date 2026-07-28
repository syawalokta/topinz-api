import { getCookie, TOKEN_COOKIE } from "@/lib/cookies";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export interface FieldError {
  field: string;
  message: string;
}

export class ApiError extends Error {
  status: number;
  errors?: FieldError[];

  constructor(message: string, status: number, errors?: FieldError[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }

  /** Field → message map for form errors. */
  get fieldErrors(): Record<string, string> {
    return Object.fromEntries(
      (this.errors ?? []).map((e) => [e.field, e.message])
    );
  }
}

interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined | null>;
  token?: string | null;
  signal?: AbortSignal;
}

/**
 * Typed fetch wrapper against the Express backend.
 * Resolves with the envelope's `data` payload, throws ApiError otherwise.
 */
export async function api<T = unknown>(
  path: string,
  opts: ApiOptions = {}
): Promise<T> {
  const url = new URL(path, API_URL);
  if (opts.params) {
    for (const [key, value] of Object.entries(opts.params)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const token = opts.token ?? getCookie(TOKEN_COOKIE);
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: opts.method ?? "GET",
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
    });
  } catch {
    throw new ApiError(
      "Tidak dapat terhubung ke server. Pastikan backend berjalan.",
      0
    );
  }

  let json: {
    success?: boolean;
    message?: string;
    data?: T;
    errors?: FieldError[];
  } | null = null;
  try {
    json = await res.json();
  } catch {
    // non-JSON response
  }

  if (!res.ok || json?.success === false) {
    throw new ApiError(
      json?.message ?? `Request gagal (${res.status})`,
      res.status,
      json?.errors
    );
  }

  return (json?.data ?? null) as T;
}

export const apiGet = <T>(path: string, params?: ApiOptions["params"]) =>
  api<T>(path, { params });
export const apiPost = <T>(path: string, body?: unknown) =>
  api<T>(path, { method: "POST", body });
export const apiPut = <T>(path: string, body?: unknown) =>
  api<T>(path, { method: "PUT", body });
export const apiPatch = <T>(path: string, body?: unknown) =>
  api<T>(path, { method: "PATCH", body });
export const apiDelete = <T>(path: string) =>
  api<T>(path, { method: "DELETE" });
