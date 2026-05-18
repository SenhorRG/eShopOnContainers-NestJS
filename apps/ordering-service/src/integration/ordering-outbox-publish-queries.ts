/**
 * Keep publish ordering identical to CLR scan: creation time ascending ensures same observable
 * inter-service side-effect order under one `TransactionId` as MediatR + outbox in reference Ordering.
 */
export const ORDERING_OUTBOX_PENDING_BY_TRANSACTION_SQL = `
SELECT
 "EventId"       AS event_id,
 "EventTypeName" AS event_type_name,
 "State"         AS state,
 "TimesSent"     AS times_sent,
 "CreationTime"  AS creation_time,
 "Content"       AS content,
 "TransactionId" AS transaction_id
FROM ordering."IntegrationEventLog"
WHERE "TransactionId" = $1::uuid AND "State" = $2::integer
ORDER BY "CreationTime" ASC
`.trim();
