export interface IntegrationEventLogRow {
  eventId: string;
  eventTypeName: string;
  state: number;
  timesSent: number;
  creationTime: string | Date;
  content: string;
  transactionId: string;
}

export function mapIntegrationEventLogRow(raw: Record<string, unknown>): IntegrationEventLogRow {
  return {
    eventId: String(raw.event_id),
    eventTypeName: String(raw.event_type_name),
    state: Number(raw.state),
    timesSent: Number(raw.times_sent),
    creationTime: raw.creation_time as string | Date,
    content: String(raw.content),
    transactionId: String(raw.transaction_id),
  };
}
