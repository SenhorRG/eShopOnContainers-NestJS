import type { IntegrationEvent } from './integration-event-base';
import type { IIntegrationEventHandler } from './integration-event-handler.interface';
import type { IntegrationJson } from './integration-json';

export type EventReviver = (body: IntegrationJson) => IntegrationEvent;

type HandlerBucket = {
  revive: EventReviver;
  handlers: Array<IIntegrationEventHandler>;
};

/**
 * Typed handler resolution equivalent to DI keyed `IIntegrationEventHandler` registrations.
 */
export class SubscriptionRegistry {
  private readonly routing = new Map<string, HandlerBucket>();

  register<T extends IntegrationEvent>(
    routingKey: string,
    revive: (body: IntegrationJson) => T,
    ...handlers: Array<IIntegrationEventHandler<T>>
  ): void {
    const bucket = this.routing.get(routingKey);
    if (!bucket) {
      this.routing.set(routingKey, { revive, handlers: [...handlers.map((h) => h as IIntegrationEventHandler)] });
      return;
    }
    bucket.revive = revive;
    bucket.handlers.push(...handlers.map((h) => h as IIntegrationEventHandler));
  }

  getKeys(): string[] {
    return [...this.routing.keys()];
  }

  resolve(routingKey: string): HandlerBucket | undefined {
    return this.routing.get(routingKey);
  }
}
