import { useEffect, useState } from 'react';

import type { NestServiceCatalogEntry } from '../catalog/types';
import type { HealthProbeResult, HealthStatus } from './types';

type HealthPollState = Record<string, HealthProbeResult>;

export type { HealthPollState };

async function probeService(service: NestServiceCatalogEntry): Promise<HealthProbeResult> {
  const started = performance.now();
  try {
    const response = await fetch(service.healthUrl, { method: 'GET' });
    return {
      id: service.id,
      status: response.ok ? 'ok' : 'fail',
      rttMs: Math.round(performance.now() - started),
    };
  } catch {
    return {
      id: service.id,
      status: 'fail',
      rttMs: null,
    };
  }
}

export function useHealthPoll(services: NestServiceCatalogEntry[], intervalMs = 15000): HealthPollState {
  const [state, setState] = useState<HealthPollState>({});

  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      const pending = Object.fromEntries(
        services.map((service) => [
          service.id,
          { id: service.id, status: 'pending' as HealthStatus, rttMs: null },
        ]),
      );
      setState(pending);

      const results = await Promise.all(services.map((service) => probeService(service)));
      if (cancelled) return;

      setState(Object.fromEntries(results.map((result) => [result.id, result])));
    };

    void tick();
    const timer = window.setInterval(() => void tick(), intervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [services, intervalMs]);

  return state;
}

export function summarizeHealth(state: HealthPollState): { healthy: number; total: number } {
  const values = Object.values(state);
  const healthy = values.filter((entry) => entry.status === 'ok').length;
  return { healthy, total: values.length };
}
