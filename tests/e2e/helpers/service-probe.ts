import type { APIRequestContext } from '@playwright/test';

export type ServiceProbe = {
  name: string;
  baseUrl: string;
  path: string;
};

export async function probeHttp(
  request: APIRequestContext,
  { baseUrl, path }: Pick<ServiceProbe, 'baseUrl' | 'path'>,
  timeoutMs = 4_000,
): Promise<boolean> {
  const url = `${baseUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
  try {
    const res = await request.get(url, { timeout: timeoutMs });
    return res.ok() || (res.status() >= 200 && res.status() < 500);
  } catch {
    return false;
  }
}

export async function probeAll(
  request: APIRequestContext,
  services: ServiceProbe[],
): Promise<{ ok: boolean; missing: string[] }> {
  const missing: string[] = [];
  for (const svc of services) {
    const up = await probeHttp(request, svc);
    if (!up) missing.push(`${svc.name} (${svc.baseUrl}${svc.path})`);
  }
  return { ok: missing.length === 0, missing };
}
