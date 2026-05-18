import { SetMetadata } from '@nestjs/common';
import type { Type } from '@nestjs/common';

import type { IntegrationEvent } from '../integration-event-base';

export const INTEGRATION_EVENT_HANDLER_KEY = 'ESHOP_INTEGRATION_EVENT_HANDLER_METADATA';

export const IntegrationEventHandler = (eventType: Type<IntegrationEvent>) =>
  SetMetadata(INTEGRATION_EVENT_HANDLER_KEY, eventType);
