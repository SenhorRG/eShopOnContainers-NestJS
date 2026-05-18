import {
  DynamicModule,
  Module,
  type InjectionToken,
  type OptionalFactoryDependency,
  type Provider,
} from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { HealthProbeController } from './health-probe.controller';
import {
  HEALTH_OPTIONS,
  type HealthModuleRegisterOptions,
} from './health.types';
import { PostgresPingIndicator } from './postgres-ping.indicator';
import { RabbitMqPingIndicator } from './rabbitmq-ping.indicator';
import { RedisPingIndicator } from './redis-ping.indicator';

@Module({})
export class HealthModule {
  static register(options: HealthModuleRegisterOptions): DynamicModule {
    return this.build({
      providers: [{ provide: HEALTH_OPTIONS, useValue: options }],
    });
  }

  static registerAsync(def: {
    imports?: DynamicModule['imports'];
    inject?: Array<InjectionToken | OptionalFactoryDependency>;
    useFactory: (
      ...args: unknown[]
    ) => HealthModuleRegisterOptions | Promise<HealthModuleRegisterOptions>;
  }): DynamicModule {
    return this.build({
      imports: def.imports,
      providers: [
        {
          provide: HEALTH_OPTIONS,
          inject: def.inject ?? ([] as Array<InjectionToken | OptionalFactoryDependency>),
          useFactory: def.useFactory,
        },
      ],
    });
  }

  private static build(opts: {
    imports?: DynamicModule['imports'];
    providers: Provider[];
  }): DynamicModule {
    return {
      module: HealthModule,
      imports: [TerminusModule, ...(opts.imports ?? [])],
      controllers: [HealthProbeController],
      providers: [
        ...opts.providers,
        PostgresPingIndicator,
        RedisPingIndicator,
        RabbitMqPingIndicator,
      ],
      exports: [TerminusModule],
    };
  }
}
