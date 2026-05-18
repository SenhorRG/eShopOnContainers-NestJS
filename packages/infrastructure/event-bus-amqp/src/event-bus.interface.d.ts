import type { IntegrationEvent } from './integration-event-base';
export interface IEventBus {
    publish(event: IntegrationEvent): Promise<void>;
}
