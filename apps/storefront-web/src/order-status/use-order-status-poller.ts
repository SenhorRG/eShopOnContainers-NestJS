import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_INTERVAL_MS = 10_000;

/**
 * Polls order detail until status settles. Works with `ESHOP_ORDERING_AUTH_BYPASS` without a Bearer token.
 * Env: `VITE_ESHOP_ORDERING_ORIGIN` (no trailing slash).
 */
export function useOrderStatusPoller(
  orderId: number | undefined,
  accessToken: string | null | undefined,
  intervalMs: number = DEFAULT_INTERVAL_MS,
): {
  data: unknown | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const [data, setData] = useState<unknown | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tokenRef = useRef(accessToken);

  useEffect(() => {
    tokenRef.current = accessToken;
  }, [accessToken]);

  const base = useMemo(
    () =>
      (typeof import.meta.env.VITE_ESHOP_ORDERING_ORIGIN === 'string'
        ? import.meta.env.VITE_ESHOP_ORDERING_ORIGIN
        : ''
      ).replace(/\/$/, ''),
    [],
  );

  const fetchOnce = useCallback(async () => {
    if (orderId === undefined || Number.isNaN(orderId) || !base.length) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const headers: Record<string, string> = {};
      const t = tokenRef.current?.trim();
      if (t?.length) {
        headers.Authorization = `Bearer ${t}`;
      }

      const res = await fetch(`${base}/api/orders/${String(orderId)}`, {
        headers,
      });

      if (!res.ok) {
        throw new Error(`ordering ${String(res.status)} ${res.statusText}`);
      }

      const body: unknown = await res.json();
      setData(body);
    } catch (e) {
      setError(String((e as Error).message ?? e));
    } finally {
      setLoading(false);
    }
  }, [base, orderId]);

  useEffect(() => {
    void fetchOnce();
  }, [fetchOnce]);

  useEffect(() => {
    if (orderId === undefined || !intervalMs) return undefined;
    const h = setInterval(() => void fetchOnce(), intervalMs);
    return () => clearInterval(h);
  }, [fetchOnce, intervalMs, orderId]);

  return { data, loading, error, refresh: fetchOnce };
}
