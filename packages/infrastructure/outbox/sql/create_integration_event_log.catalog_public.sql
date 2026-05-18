-- Reference DDL aligned with Catalog EF migration `Catalog.API\Infrastructure\Migrations\20231026091140_Outbox.cs` (implicit `public` schema).
CREATE TABLE IF NOT EXISTS public."IntegrationEventLog" (
  "EventId" uuid PRIMARY KEY NOT NULL,
  "EventTypeName" text NOT NULL,
  "State" integer NOT NULL,
  "TimesSent" integer NOT NULL,
  "CreationTime" timestamptz NOT NULL,
  "Content" text NOT NULL,
  "TransactionId" uuid NOT NULL
);
