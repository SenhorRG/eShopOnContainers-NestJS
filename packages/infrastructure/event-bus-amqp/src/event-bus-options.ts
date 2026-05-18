export type AmqpConnectionConfig = {
  hostname: string;
  port: number;
  username: string;
  password: string;
  vhost?: string;
  heartbeatIntervalInSeconds?: number;
};

export type ConsumerAckPolicy = 'always' | 'afterHandlerSuccess';

export type EventBusOptions = {
  /** Stable queue name used when declaring the consumer subscription. */
  subscriptionClientName: string;
  /** Publisher retries for transient broker/socket failures. */
  retryCount: number;
  connection: AmqpConnectionConfig;
  /** Consumer QoS prefetch (manual ack). */
  prefetch?: number;
  /**
   * `always`: ack after handler returns (even if the handler failed).
   * `afterHandlerSuccess`: ack only when all handlers succeed; handler errors nack with requeue where appropriate.
   */
  consumerAckPolicy?: ConsumerAckPolicy;
};

export const defaultEventBusOptions = (partial: Partial<EventBusOptions> & Pick<EventBusOptions, 'subscriptionClientName'>): EventBusOptions => ({
  subscriptionClientName: partial.subscriptionClientName,
  retryCount: partial.retryCount ?? 10,
  connection: {
    hostname: partial.connection?.hostname ?? '127.0.0.1',
    port: partial.connection?.port ?? 5672,
    username: partial.connection?.username ?? 'guest',
    password: partial.connection?.password ?? 'guest',
    vhost: partial.connection?.vhost ?? '/',
    heartbeatIntervalInSeconds: partial.connection?.heartbeatIntervalInSeconds ?? 30,
  },
  prefetch: partial.prefetch ?? 10,
  consumerAckPolicy: partial.consumerAckPolicy ?? 'always',
});
