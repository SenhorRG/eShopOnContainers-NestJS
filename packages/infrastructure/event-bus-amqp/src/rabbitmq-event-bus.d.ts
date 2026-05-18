import type { IEventBus } from './event-bus.interface';
import type { EventBusOptions } from './event-bus-options';
import type { IntegrationEvent } from './integration-event-base';
import type { MinimalLogger } from './minimal-logger';
import { RabbitMqTelemetry } from './rabbitmq-telemetry';
import type { SubscriptionRegistry } from './subscription-registry';
export declare class RabbitMqEventBus implements IEventBus {
    private readonly options;
    private readonly subscriptions;
    private readonly telemetry;
    private readonly logger;
    private connection?;
    private publisher?;
    private consumer?;
    constructor(options: EventBusOptions, subscriptions: SubscriptionRegistry, telemetry: RabbitMqTelemetry, logger?: MinimalLogger);
    start(): Promise<void>;
    stop(): Promise<void>;
    publish(event: IntegrationEvent): Promise<void>;
    private onMessage;
}
