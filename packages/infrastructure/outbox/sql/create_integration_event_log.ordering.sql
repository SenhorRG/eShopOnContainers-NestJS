-- Reference DDL aligned with Ordering EF migration `Ordering.Infrastructure\Migrations\20231026091055_Outbox.cs`.
CREATE TABLE IF NOT EXISTS ordering."IntegrationEventLog" (
  "EventId" uuid PRIMARY KEY NOT NULL,
  "EventTypeName" text NOT NULL,
  "State" integer NOT NULL,
  "TimesSent" integer NOT NULL,
  "CreationTime" timestamptz NOT NULL,
  "Content" text NOT NULL,
  "TransactionId" uuid NOT NULL
);
