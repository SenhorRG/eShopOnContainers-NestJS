import type { Type } from '@nestjs/common';
import type { IntegrationEvent } from '../integration-event-base';
import type { IntegrationJson } from '../integration-json';
export declare function reviveFromEventClass<T extends IntegrationEvent>(EventClass: Type<T>): (json: IntegrationJson) => T;
