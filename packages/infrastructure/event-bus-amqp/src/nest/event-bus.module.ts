import type {
  DynamicModule,
  InjectionToken,
  OptionalFactoryDependency,
} from '@nestjs/common';
import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';

import type { EventBusOptions } from '../event-bus-options';
import { RabbitMqEventBus } from '../rabbitmq-event-bus';
import { RabbitMqTelemetry } from '../rabbitmq-telemetry';
import { SubscriptionRegistry } from '../subscription-registry';
import { EVENT_BUS, EVENT_BUS_OPTIONS } from './event-bus.constants';
import { EventBusLifecycleService } from './event-bus-lifecycle.service';

export interface EventBusModuleAsyncOptions {
  imports?: DynamicModule['imports'];
  inject?: Array<InjectionToken | OptionalFactoryDependency>;
  useFactory: (...args: unknown[]) => Promise<EventBusOptions> | EventBusOptions;
}

@Module({})
export class EventBusModule {
  static registerAsync(opts: EventBusModuleAsyncOptions): DynamicModule {
    return {
      module: EventBusModule,
      global: true,
      imports: [DiscoveryModule, ...(opts.imports ?? [])],
      providers: [
        SubscriptionRegistry,
        RabbitMqTelemetry,
        EventBusLifecycleService,
        {
          provide: EVENT_BUS_OPTIONS,
          useFactory: opts.useFactory,
          inject: opts.inject ?? [],
        },
        {
          provide: RabbitMqEventBus,
          useFactory: (o: EventBusOptions, reg: SubscriptionRegistry, tel: RabbitMqTelemetry) =>
            new RabbitMqEventBus(o, reg, tel),
          inject: [EVENT_BUS_OPTIONS, SubscriptionRegistry, RabbitMqTelemetry],
        },
        {
          provide: EVENT_BUS,
          useExisting: RabbitMqEventBus,
        },
      ],
      exports: [EVENT_BUS, RabbitMqEventBus, SubscriptionRegistry],
    };
  }
}
