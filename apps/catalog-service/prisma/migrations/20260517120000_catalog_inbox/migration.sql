-- Consumer inbox ledger for idempotent integration event handling
CREATE TABLE IF NOT EXISTS "processed_integration_events" (
    "id" UUID NOT NULL,
    "integration_event_id" UUID NOT NULL,
    "consumer_name" VARCHAR(200) NOT NULL,
    "processed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "processed_integration_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "processed_integration_events_event_consumer_key"
    ON "processed_integration_events"("integration_event_id", "consumer_name");
