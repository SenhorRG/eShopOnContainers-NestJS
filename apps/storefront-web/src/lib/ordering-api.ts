import { apiBase } from './env';

const orderingBase = () => apiBase(import.meta.env.VITE_ESHOP_ORDERING_ORIGIN, 'http://127.0.0.1:5053');

function ordersApiUrl(path: string): string {
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${orderingBase()}/api/orders${suffix}`;
}

export type CardTypeVm = { id: number; name: string };

export type OrderSummaryVm = {
  orderNumber: number;
  date: string;
  status: string;
  total: number;
};

function authHeaders(token: string | null): HeadersInit {
  const h: Record<string, string> = {};
  if (token?.trim().length) {
    h.Authorization = `Bearer ${token.trim()}`;
  }
  return h;
}

export async function fetchCardTypes(token: string | null): Promise<CardTypeVm[]> {
  const res = await fetch(ordersApiUrl('/cardtypes'), {
    headers: { ...authHeaders(token) },
  });
  if (!res.ok) throw new Error(`cardtypes ${String(res.status)}`);
  const raw = (await res.json()) as Array<{ id?: number; name?: string; Id?: number; Name?: string }>;
  return raw.map((c) => ({
    id: Number(c.id ?? c.Id ?? 0),
    name: String(c.name ?? c.Name ?? ''),
  }));
}

export async function postDraft(
  token: string | null,
  body: {
    buyerId: string;
    items: Array<{
      productId: number;
      productName: string;
      unitPrice: number;
      pictureUrl: string;
      quantity: number;
    }>;
  },
): Promise<void> {
  const res = await fetch(ordersApiUrl('/draft'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`draft ${String(res.status)} ${t}`);
  }
}

export async function postSubmitOrder(
  token: string | null,
  body: Record<string, unknown>,
): Promise<void> {
  const rid = crypto.randomUUID();
  const res = await fetch(ordersApiUrl(''), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-requestid': rid,
      ...authHeaders(token),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`submit ${String(res.status)} ${t}`);
  }
}

export async function fetchMyOrders(token: string | null): Promise<OrderSummaryVm[]> {
  if (!token?.trim().length) {
    throw new Error('orders_unauthorized');
  }
  const res = await fetch(ordersApiUrl(''), {
    headers: { ...authHeaders(token) },
  });
  if (res.status === 401) {
    throw new Error('orders_unauthorized');
  }
  if (!res.ok) throw new Error(`orders list ${String(res.status)}`);
  const raw = (await res.json()) as unknown[];
  if (!Array.isArray(raw)) return [];
  return raw.map((row) => {
    const r = row as Record<string, unknown>;
    return {
      orderNumber: Number(r.orderNumber ?? r.OrderNumber ?? 0),
      date: String(r.date ?? r.Date ?? ''),
      status: String(r.status ?? r.Status ?? ''),
      total: Number(r.total ?? r.Total ?? 0),
    };
  });
}
