import { describe, expect, it, vi } from 'vitest';

import { IntegrationEvent } from './integration-event-base';
import type { IIntegrationEventHandler } from './integration-event-handler.interface';
import { SubscriptionRegistry } from './subscription-registry';

class SmokeEvent extends IntegrationEvent {
  UserId!: string;

  static revive(body: Record<string, unknown>): SmokeEvent {
    const e = new SmokeEvent(body.Id as string, body.CreationDate as string);
    e.UserId = String(body.UserId ?? '');
    return e;
  }
}

describe('SubscriptionRegistry', () => {
  it('stores revivers keyed by routing key', () => {
    const registry = new SubscriptionRegistry();
    const handler: IIntegrationEventHandler<SmokeEvent> = {
      async handle(ev: SmokeEvent) {
        void ev;
      },
    };

    registry.register('SmokeEvent', SmokeEvent.revive, handler);

    const bucket = registry.resolve('SmokeEvent');
    expect(bucket).toBeDefined();
    expect(bucket?.handlers.length).toBe(1);

    const restored = bucket!.revive({ Id: 'x', CreationDate: '2026-01-01', UserId: 'u1' });
    expect(restored).toBeInstanceOf(SmokeEvent);
    expect(restored.routingKey).toBe('SmokeEvent');
    expect(restored.UserId).toBe('u1');
  });

  it('supports multiple handlers for one routing key', async () => {
    const registry = new SubscriptionRegistry();
    const spyA = vi.fn();
    const spyB = vi.fn();

    registry.register(
      'SmokeEvent',
      SmokeEvent.revive,
      { async handle(ev) { spyA(ev.UserId); } },
      { async handle(ev) { spyB(ev.UserId); } },
    );

    const bucket = registry.resolve('SmokeEvent');
    await bucket!.handlers[0]!.handle(bucket!.revive({ UserId: 'z' }));
    await bucket!.handlers[1]!.handle(bucket!.revive({ UserId: 'z' }));

    expect(spyA).toHaveBeenCalledWith('z');
    expect(spyB).toHaveBeenCalledWith('z');
    expect(registry.getKeys()).toEqual(['SmokeEvent']);
  });
});
