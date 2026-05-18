import type { IntegrationEvent } from '@eshop/event-bus-amqp';
import { describe, expect, it } from 'vitest';

import { EventState } from './event-state';
import type { IntegrationEventLogRow } from './integration-event-log-row';
import { OutboxPublisher } from './outbox-publisher';

function fixtureRow(content: string) {
  return {
    event_id: '11111111-1111-1111-1111-111111111111',
    event_type_name: 'SampleIntegrationEvent',
    state: EventState.InProgress,
    times_sent: 1,
    creation_time: '2026-01-02T03:04:05.000Z',
    content,
    transaction_id: '22222222-2222-2222-2222-222222222222',
  };
}

describe('OutboxPublisher', () => {
  it('ticks: claims row, publishes, then marks Published', async () => {
    const statuses: Array<{ evt: string; state: number }> = [];

    const publisher = new OutboxPublisher({
      executor: {
        async query<R extends Record<string, unknown>>(sql: string, params?: unknown[]) {
          const s = sql.toUpperCase();
          if (s.includes('FOR UPDATE SKIP LOCKED')) {
            return { rows: [fixtureRow('{}') as unknown as R] };
          }
          if (s.startsWith('UPDATE') && sql.includes('"State"')) {
            statuses.push({
              evt: String(params?.[0]),
              state: Number(params?.[1]),
            });
            return { rows: [] };
          }
          return { rows: [] };
        },
      },
      schema: 'ordering',
      revive(_r: IntegrationEventLogRow): IntegrationEvent {
        return { routingKey: 'SampleIntegrationEvent' } as IntegrationEvent;
      },
      publish: async () => {
        /* no-op success */
      },
    });

    await publisher.tickOnce();

    expect(statuses).toContainEqual({
      evt: '11111111-1111-1111-1111-111111111111',
      state: EventState.Published,
    });
    publisher.stop();
  });

  it('ticks: when publish rejects, marks PublishedFailed', async () => {
    const statuses: Array<{ evt: string; state: number }> = [];

    const publisher = new OutboxPublisher({
      executor: {
        async query<R extends Record<string, unknown>>(sql: string, params?: unknown[]) {
          const s = sql.toUpperCase();
          if (s.includes('FOR UPDATE SKIP LOCKED')) {
            return { rows: [fixtureRow('{}') as unknown as R] };
          }
          if (s.startsWith('UPDATE') && sql.includes('"State"')) {
            statuses.push({
              evt: String(params?.[0]),
              state: Number(params?.[1]),
            });
            return { rows: [] };
          }
          return { rows: [] };
        },
      },
      schema: 'ordering',
      revive(_r: IntegrationEventLogRow): IntegrationEvent {
        return { routingKey: 'SampleIntegrationEvent' } as IntegrationEvent;
      },
      publish: async () => {
        throw new Error('bus down');
      },
    });

    await publisher.tickOnce();

    expect(statuses).toContainEqual({
      evt: '11111111-1111-1111-1111-111111111111',
      state: EventState.PublishedFailed,
    });
    publisher.stop();
  });
});
