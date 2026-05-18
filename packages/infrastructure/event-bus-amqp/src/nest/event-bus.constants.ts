import type { InjectionToken } from '@nestjs/common';

import type { IEventBus } from '../event-bus.interface';

export const EVENT_BUS_OPTIONS = Symbol('ESHOP_EVENT_BUS_OPTIONS');

export const EVENT_BUS: InjectionToken<IEventBus> = Symbol('ESHOP_IEVENT_BUS_INSTANCE');
