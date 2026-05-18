import type { AmqpConnectionConfig } from './event-bus-options';
export declare function rabbitAmqpUriFromProcessEnv(): string;
export declare function buildConnectionUri(opts: AmqpConnectionConfig): string;
