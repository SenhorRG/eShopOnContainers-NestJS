CREATE SCHEMA IF NOT EXISTS webhooks;

CREATE TABLE webhooks.processed_integration_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    integration_event_id UUID NOT NULL,
    consumer_name VARCHAR(200) NOT NULL,
    processed_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT processed_integration_events_event_consumer_key UNIQUE (integration_event_id, consumer_name)
);

CREATE INDEX ix_processed_integration_events_processed_at ON webhooks.processed_integration_events (processed_at);
