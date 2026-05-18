import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { deleteBasket, fetchBasket, putBasket } from './basket-api';

describe('basket-api', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_ESHOP_BFF_ORIGIN', 'http://bff.test');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('fetchBasket returns normalized items', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ items: [{ productId: 1, quantity: 2 }] }),
      }),
    );

    const items = await fetchBasket('tok');
    expect(items).toEqual([{ productId: 1, quantity: 2 }]);
    expect(fetch).toHaveBeenCalledWith(
      'http://bff.test/api/basket',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer tok' }),
      }),
    );
  });

  it('fetchBasket throws on 401', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }));
    await expect(fetchBasket('bad')).rejects.toThrow('basket_unauthorized');
  });

  it('putBasket sends items body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ items: [{ productId: 3, quantity: 1 }] }),
      }),
    );

    const items = await putBasket('tok', [{ productId: 3, quantity: 1 }]);
    expect(items).toEqual([{ productId: 3, quantity: 1 }]);
    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('PUT');
    expect(JSON.parse(String(init.body))).toEqual({ items: [{ productId: 3, quantity: 1 }] });
  });

  it('deleteBasket accepts 204', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 204 }));
    await expect(deleteBasket('tok')).resolves.toBeUndefined();
    expect(fetch).toHaveBeenCalledWith(
      'http://bff.test/api/basket',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
