import { apiBase } from './env';

export function webhooksApiOrigin(): string {
  return apiBase(import.meta.env.VITE_ESHOP_WEBHOOKS_ORIGIN, 'http://127.0.0.1:5055');
}

export type WebhookSubscriptionRow = {
  id: number;
  userId: string;
  type: string;
  destUrl: string;
  token: string | null;
  date: string;
};

export async function listWebhookSubscriptions(accessToken: string | null): Promise<WebhookSubscriptionRow[]> {
  const base = webhooksApiOrigin();
  const headers: Record<string, string> = {};
  const bearer = accessToken?.trim();
  if (bearer?.length) headers.Authorization = `Bearer ${bearer}`;
  const res = await fetch(`${base}/api/webhooks?api-version=1`, { headers });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`webhooks list ${String(res.status)} ${t}`);
  }
  return (await res.json()) as WebhookSubscriptionRow[];
}

export async function createWebhookSubscription(input: {
  accessToken: string | null;
  url: string;
  grantUrl: string;
  token: string;
  event: string;
}): Promise<void> {
  const base = webhooksApiOrigin();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const bearer = input.accessToken?.trim();
  if (bearer?.length) {
    headers.Authorization = `Bearer ${bearer}`;
  }
  const res = await fetch(`${base}/api/webhooks?api-version=1`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      url: input.url.trim(),
      grantUrl: input.grantUrl.trim(),
      token: input.token.trim(),
      event: input.event.trim(),
    }),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`webhooks ${String(res.status)} ${t}`);
  }
}
