import type { IntegrationEvent } from './integration-event-base';
export interface IIntegrationEventHandler<T extends IntegrationEvent = IntegrationEvent> {
    handle(event: T): Promise<void>;
}
