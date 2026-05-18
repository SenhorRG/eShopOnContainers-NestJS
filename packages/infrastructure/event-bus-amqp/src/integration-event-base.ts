import { randomUUID } from 'node:crypto';

/**
 * Base envelope for integration events (PascalCase public properties).
 */
export abstract class IntegrationEvent {
  Id: string;
  CreationDate: string;

  protected constructor(id?: string, creationDate?: string) {
    this.Id = id ?? randomUUID();
    this.CreationDate = creationDate ?? new Date().toISOString();
  }

  /** Rabbit routing key equals the event class short name (`constructor.name`). */
  get routingKey(): string {
    return this.constructor.name;
  }

  toJSON(): Record<string, unknown> {
    return { ...this } as Record<string, unknown>;
  }
}
