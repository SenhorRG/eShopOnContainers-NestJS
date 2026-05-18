/** Claim next `NotPublished` row and move it to `InProgress`, incrementing `TimesSent`. */
export function integrationEventClaimAndMarkInProgressSql(qualifiedTable: string): string {
  return `
UPDATE ${qualifiedTable} AS t
SET "State" = $2, "TimesSent" = t."TimesSent" + 1
WHERE t."EventId" = (
  SELECT l."EventId"
  FROM ${qualifiedTable} AS l
  WHERE l."State" = $1
  ORDER BY l."CreationTime" ASC
  FOR UPDATE SKIP LOCKED
  LIMIT 1
)
RETURNING
  t."EventId" AS event_id,
  t."EventTypeName" AS event_type_name,
  t."State" AS state,
  t."TimesSent" AS times_sent,
  t."CreationTime" AS creation_time,
  t."Content" AS content,
  t."TransactionId" AS transaction_id
`.trim();
}

export function integrationEventUpdateStateSql(qualifiedTable: string): string {
  return `UPDATE ${qualifiedTable} SET "State" = $2 WHERE "EventId" = $1::uuid`;
}
