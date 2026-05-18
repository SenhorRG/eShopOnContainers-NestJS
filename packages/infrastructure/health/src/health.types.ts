export const HEALTH_OPTIONS = Symbol('ESHOP_HEALTH_OPTIONS');

export interface HealthModuleRegisterOptions {
  /** When true, readiness error payloads avoid leaking internals. */
  sensitiveEnvironment?: boolean;
  postgresUrl?: string;
  redisUrl?: string;
  /** Full AMQP URI; used to open a short-lived connection. */
  rabbitUri?: string;
}
