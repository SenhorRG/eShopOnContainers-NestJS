import type { Type } from '@nestjs/common';
import type { IntegrationEvent } from '../integration-event-base';
export declare const INTEGRATION_EVENT_HANDLER_KEY = "ESHOP_INTEGRATION_EVENT_HANDLER_METADATA";
export declare const IntegrationEventHandler: (eventType: Type<IntegrationEvent>) => import("node_modules/@nestjs/common").CustomDecorator<string>;
