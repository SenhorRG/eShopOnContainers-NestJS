import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type { Type } from '@nestjs/common';
import { DiscoveryService, ModuleRef } from '@nestjs/core';

import type { IntegrationEvent } from '../integration-event-base';
import type { IIntegrationEventHandler } from '../integration-event-handler.interface';
import { RabbitMqEventBus } from '../rabbitmq-event-bus';
import { SubscriptionRegistry } from '../subscription-registry';
import { INTEGRATION_EVENT_HANDLER_KEY } from './integration-event-handler.decorator';
import { reviveFromEventClass } from './revive-from-event-class';

@Injectable()
export class EventBusLifecycleService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(EventBusLifecycleService.name);

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly moduleRef: ModuleRef,
    private readonly registry: SubscriptionRegistry,
    private readonly bus: RabbitMqEventBus,
  ) {}

  async onModuleInit(): Promise<void> {
    for (const wrapper of this.discovery.getProviders()) {
      const metatype = wrapper.metatype as Type<object> | undefined;
      if (!metatype || typeof metatype !== 'function') continue;

      const eventType = Reflect.getMetadata(INTEGRATION_EVENT_HANDLER_KEY, metatype) as
        | Type<IntegrationEvent>
        | undefined;
      if (!eventType) continue;

      const instance = this.moduleRef.get<IIntegrationEventHandler<IntegrationEvent>>(metatype, {
        strict: false,
      });
      const revive = reviveFromEventClass(eventType);
      const routingKey = eventType.name;
      this.registry.register(routingKey, revive, instance);

      this.log.log(`Handler ${metatype.name} → routing key "${routingKey}"`);
    }

    const keys = this.registry.getKeys();
    this.log.log(`Integration routing keys (${keys.length}): ${keys.sort().join(', ') || '(none)'}`);

    await this.bus.start();
  }

  async onModuleDestroy(): Promise<void> {
    await this.bus.stop();
  }
}
