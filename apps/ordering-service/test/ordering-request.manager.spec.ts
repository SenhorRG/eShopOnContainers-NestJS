import { describe, expect, it } from 'vitest';

import { OrderingRequestManager } from '../src/application/ordering/ordering-request.manager';

type ClientRequestRow = { Id: string; Name: string; Time: Date };

function memoryOrderingClientRequest() {
  const rows = new Map<string, ClientRequestRow>();

  return {
    findUnique: async ({ where }: { where: { Id: string } }) => rows.get(where.Id) ?? null,
    create: async ({ data }: { data: ClientRequestRow }) => {
      if (rows.has(data.Id)) {
        const err = Object.assign(new Error('unique'), { code: 'P2002' });
        throw err;
      }
      rows.set(data.Id, data);
      return data;
    },
    rows,
  };
}

describe('OrderingRequestManager', () => {
  it('tracks idempotency keys per transaction delegate', async () => {
    const delegate = memoryOrderingClientRequest();
    const manager = new OrderingRequestManager();
    const tx = { orderingClientRequest: delegate } as never;

    expect(await manager.exists(tx, 'req-1')).toBe(false);
    expect(await manager.createIfAbsent(tx, 'req-1', 'CreateOrderCommand')).toBe(true);
    expect(await manager.exists(tx, 'req-1')).toBe(true);
    expect(await manager.createIfAbsent(tx, 'req-1', 'CreateOrderCommand')).toBe(false);
  });
});
