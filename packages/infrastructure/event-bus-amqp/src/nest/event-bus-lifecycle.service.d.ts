import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, ModuleRef } from '@nestjs/core';
import { RabbitMqEventBus } from '../rabbitmq-event-bus';
import { SubscriptionRegistry } from '../subscription-registry';
export declare class EventBusLifecycleService implements OnModuleInit, OnModuleDestroy {
    private readonly discovery;
    private readonly moduleRef;
    private readonly registry;
    private readonly bus;
    private readonly log;
    constructor(discovery: DiscoveryService, moduleRef: ModuleRef, registry: SubscriptionRegistry, bus: RabbitMqEventBus);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
