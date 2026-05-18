import type { DynamicModule, InjectionToken, OptionalFactoryDependency } from '@nestjs/common';
import type { EventBusOptions } from '../event-bus-options';
export interface EventBusModuleAsyncOptions {
    imports?: DynamicModule['imports'];
    inject?: Array<InjectionToken | OptionalFactoryDependency>;
    useFactory: (...args: unknown[]) => Promise<EventBusOptions> | EventBusOptions;
}
export declare class EventBusModule {
    static registerAsync(opts: EventBusModuleAsyncOptions): DynamicModule;
}
