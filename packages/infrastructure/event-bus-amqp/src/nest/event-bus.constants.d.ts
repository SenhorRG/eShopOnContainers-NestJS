import type { InjectionToken } from '@nestjs/common';
import type { IEventBus } from '../event-bus.interface';
export declare const EVENT_BUS_OPTIONS: unique symbol;
export declare const EVENT_BUS: InjectionToken<IEventBus>;
