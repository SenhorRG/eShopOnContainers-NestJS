import type { AmqpConnectionConfig } from './event-bus-options';

/** Uses `ESHOP_RABBITMQ_*` (host port defaults aligned with `deploy/compose/.env.example`). */
export function rabbitAmqpUriFromProcessEnv(): string {
  return buildConnectionUri({
    hostname: process.env.ESHOP_RABBITMQ_HOST ?? '127.0.0.1',
    port: Number(process.env.ESHOP_RABBITMQ_PORT ?? '55672'),
    username: process.env.ESHOP_RABBITMQ_USERNAME ?? 'guest',
    password: process.env.ESHOP_RABBITMQ_PASSWORD ?? 'guest',
    vhost: process.env.ESHOP_RABBITMQ_VHOST ?? '/',
  });
}

/** Compose an amqplib-compatible URI honoring virtual host conventions. */
export function buildConnectionUri(opts: AmqpConnectionConfig): string {
  const user = encodeURIComponent(opts.username);
  const password = encodeURIComponent(opts.password);
  let vhost = opts.vhost ?? '/';
  if (!vhost.startsWith('/')) {
    vhost = `/${vhost}`;
  }
  const slashEncoded = encodeURIComponent(vhost); // '/' -> '%2F'
  return `amqp://${user}:${password}@${opts.hostname}:${opts.port}/${slashEncoded}`;
}
