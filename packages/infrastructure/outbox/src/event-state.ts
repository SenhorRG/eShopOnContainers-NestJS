/**
 * Mirrors `eShop.IntegrationEventLogEF.EventStateEnum` numeric values persisted in Postgres.
 */
export const EventState = {
  NotPublished: 0,
  InProgress: 1,
  Published: 2,
  PublishedFailed: 3,
} as const;

export type EventStateValue = (typeof EventState)[keyof typeof EventState];
