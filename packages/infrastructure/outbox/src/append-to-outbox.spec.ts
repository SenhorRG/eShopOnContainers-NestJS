import { IntegrationEvent } from '@eshop/event-bus-amqp';
import { describe, expect, it } from 'vitest';

import { appendToOutbox } from './append-to-outbox';

class SampleIntegrationEvent extends IntegrationEvent {
  declare Extra: string;

  constructor(extra: string) {
    super();
    this.Extra = extra;
  }
}

describe('appendToOutbox', () => {
  it('emits parameterized INSERT targeting IntegrationEventLog', async () => {
    const batches: unknown[][] = [];

    await appendToOutbox(
      {
        query: async (_sql, params) => {
          batches.push(params ?? []);
          return { rows: [] };
        },
      },
      '2c3c4bff-aaaa-bbbb-cccc-dddddddddddd',
      new SampleIntegrationEvent('x'),
      { schema: 'ordering' },
    );

    expect(batches).toHaveLength(1);
    const p = batches[0] as unknown[];
    expect(p[3]).toBe(0); // TimesSent baseline
    expect(p[2]).toBe(0); // EventState.NotPublished
    expect(p[6]).toBe('2c3c4bff-aaaa-bbbb-cccc-dddddddddddd');
    expect(String(p[5])).toContain('"Extra": "x"');
  });

  it('staging semantics: rollback discards staged INSERT; commit persists exactly once', async () => {
    const committedPayloads: unknown[][] = [];

    interface Stage {
      query(sql: string, params?: unknown[]): Promise<{ rows: never[] }>;
    }

    const makeStage = (): Stage => {
      let staged: unknown[][] | null = null;

      return {
        query: async (sql, params = []) => {
          const trimmed = sql.trim();

          if (/^\s*BEGIN\b/i.test(trimmed)) {
            staged = [];
            return { rows: [] };
          }

          if (/^\s*ROLLBACK\b/i.test(trimmed)) {
            staged = null;
            return { rows: [] };
          }

          if (/^\s*COMMIT\b/i.test(trimmed)) {
            if (staged) committedPayloads.push(...staged);
            staged = null;
            return { rows: [] };
          }

          if (staged !== null && /INSERT/i.test(trimmed)) {
            staged.push(params as unknown[]);
            return { rows: [] };
          }

          throw new Error(`Unexpected SQL during staging test: ${trimmed}`);
        },
      };
    };

    const db = makeStage();

    await db.query('BEGIN');
    await appendToOutbox(
      db,
      'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      new SampleIntegrationEvent('lost'),
      { schema: null },
    );
    await db.query('ROLLBACK');
    expect(committedPayloads).toHaveLength(0);

    await db.query('BEGIN');
    await appendToOutbox(
      db,
      'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      new SampleIntegrationEvent('kept'),
      { schema: null },
    );
    await db.query('COMMIT');
    expect(committedPayloads).toHaveLength(1);
    expect(String(committedPayloads[0][5])).toContain('"Extra": "kept"');
  });
});
