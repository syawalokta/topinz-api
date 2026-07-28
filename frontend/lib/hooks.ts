"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";

interface UseApiResult<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

/**
 * Fetches a backend path on mount (and whenever `path` changes).
 * Pass `null` to skip fetching (e.g. while auth is loading).
 */
export function useApi<T>(path: string | null): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(path !== null);
  const pathRef = useRef(path);
  pathRef.current = path;

  const fetchData = useCallback(async (target: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api<T>(target);
      if (pathRef.current === target) setData(result);
    } catch (err) {
      if (pathRef.current === target) {
        setError(err instanceof ApiError ? err.message : "Terjadi kesalahan");
      }
    } finally {
      if (pathRef.current === target) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (path === null) return;
    void fetchData(path);
  }, [path, fetchData]);

  const refetch = useCallback(async () => {
    if (pathRef.current !== null) await fetchData(pathRef.current);
  }, [fetchData]);

  return { data, error, loading, refetch };
}

/** Debounce a fast-changing value (search inputs). */
export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/** Build a query string from params, skipping empty values. */
export function buildQuery(
  params: Record<string, string | number | boolean | undefined | null>
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}
