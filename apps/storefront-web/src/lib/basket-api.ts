import { apiBase } from './env';

export type BasketItemWire = {
  productId: number;
  quantity: number;
};

export type BasketWireResponse = {
  items: Array<{ productId: number; quantity: number }>;
};

function bffBase(): string {
  return apiBase(import.meta.env.VITE_ESHOP_BFF_ORIGIN, 'http://127.0.0.1:5070');
}

function basketUrl(): string {
  return `${bffBase()}/api/basket`;
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token.trim()}`, 'Content-Type': 'application/json' };
}

export async function fetchBasket(token: string): Promise<BasketItemWire[]> {
  const res = await fetch(basketUrl(), { headers: authHeaders(token) });
  if (res.status === 401) {
    throw new Error('basket_unauthorized');
  }
  if (!res.ok) {
    throw new Error(`basket_get_${String(res.status)}`);
  }
  const body = (await res.json()) as BasketWireResponse;
  return (body.items ?? []).map((i) => ({
    productId: Number(i.productId),
    quantity: Number(i.quantity),
  }));
}

export async function putBasket(token: string, items: BasketItemWire[]): Promise<BasketItemWire[]> {
  const res = await fetch(basketUrl(), {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify({
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    }),
  });
  if (res.status === 401) {
    throw new Error('basket_unauthorized');
  }
  if (!res.ok) {
    throw new Error(`basket_put_${String(res.status)}`);
  }
  const body = (await res.json()) as BasketWireResponse;
  return (body.items ?? []).map((i) => ({
    productId: Number(i.productId),
    quantity: Number(i.quantity),
  }));
}

export async function deleteBasket(token: string): Promise<void> {
  const res = await fetch(basketUrl(), {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (res.status === 401) {
    throw new Error('basket_unauthorized');
  }
  if (res.status !== 204 && !res.ok) {
    throw new Error(`basket_delete_${String(res.status)}`);
  }
}
