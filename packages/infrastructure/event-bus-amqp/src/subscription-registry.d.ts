import type { IntegrationEvent } from './integration-event-base';
import type { IIntegrationEventHandler } from './integration-event-handler.interface';
import type { IntegrationJson } from './integration-json';
export type EventReviver = (body: IntegrationJson) => IntegrationEvent;
type HandlerBucket = {
    revive: EventReviver;
    handlers: Array<IIntegrationEventHandler>;
};
export declare class SubscriptionRegistry {
    private readonly routing;
    register<T extends IntegrationEvent>(routingKey: string, revive: (body: IntegrationJson) => T, ...handlers: Array<IIntegrationEventHandler<T>>): void;
    getKeys(): string[];
    resolve(routingKey: string): HandlerBucket | undefined;
}
export {};
