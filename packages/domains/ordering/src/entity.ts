import type { DomainEvent } from './domain-event';

/** Rich entity with domain-event collection aligned with Ordering.Domain aggregate patterns. */
export abstract class Entity {
  private readonly _domainEvents: DomainEvent[] = [];

  abstract get id(): number | undefined;

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  pullDomainEvents(): DomainEvent[] {
    const next = [...this._domainEvents];
    this._domainEvents.length = 0;
    return next;
  }

  peekDomainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }
}
