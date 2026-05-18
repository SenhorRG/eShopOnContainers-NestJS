import type { Type } from '@nestjs/common';

import type { IntegrationEvent } from '../integration-event-base';
import type { IntegrationJson } from '../integration-json';

export function reviveFromEventClass<T extends IntegrationEvent>(
  EventClass: Type<T>,
): (json: IntegrationJson) => T {
  const candidate = EventClass as unknown as { revive?: (j: IntegrationJson) => T };
  if (typeof candidate.revive !== 'function') {
    throw new Error(
      `${EventClass.name} must expose static revive(json): ${EventClass.name} — required for Nest auto-discovery`,
    );
  }
  return (json: IntegrationJson) => candidate.revive!.call(EventClass, json);
}
