import { apiBase } from './env';

export type ChatRole = 'user' | 'assistant' | 'system';

export type ChatMessage = { role: ChatRole; content: string };

export type CatalogChatStatus = { available: boolean; provider: string };

function catalogOrigin(): string {
  return apiBase(import.meta.env.VITE_ESHOP_CATALOG_ORIGIN, 'http://127.0.0.1:5052');
}

export async function fetchCatalogChatStatus(): Promise<CatalogChatStatus> {
  const res = await fetch(`${catalogOrigin()}/api/catalog/chat/status`);
  if (!res.ok) {
    return { available: false, provider: 'none' };
  }
  return (await res.json()) as CatalogChatStatus;
}

export async function sendCatalogChatCompletion(messages: ChatMessage[]): Promise<string> {
  const res = await fetch(`${catalogOrigin()}/api/catalog/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`chat ${String(res.status)} ${t}`);
  }
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('Empty chat response');
  return text;
}
