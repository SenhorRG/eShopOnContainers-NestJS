import { defaultEventBusOptions, type EventBusOptions } from '../event-bus-options';

/** Defaults alinhados a `deploy/compose/.env.example` quando serviços correm na máquina host. */
export function eventBusOptionsFromEnv(
  subscriptionClientName: string,
  partial?: Partial<EventBusOptions>,
): EventBusOptions {
  return defaultEventBusOptions({
    subscriptionClientName,
    retryCount: Number(process.env.ESHOP_EVENT_BUS_PUBLISH_RETRY ?? 10),
    connection: {
      hostname: partial?.connection?.hostname ?? process.env.ESHOP_RABBITMQ_HOST ?? '127.0.0.1',
      port: Number(partial?.connection?.port ?? process.env.ESHOP_RABBITMQ_PORT ?? '55672'),
      username: partial?.connection?.username ?? process.env.ESHOP_RABBITMQ_USERNAME ?? 'guest',
      password: partial?.connection?.password ?? process.env.ESHOP_RABBITMQ_PASSWORD ?? 'guest',
      vhost: partial?.connection?.vhost ?? process.env.ESHOP_RABBITMQ_VHOST ?? '/',
    },
    prefetch: partial?.prefetch ?? 10,
    consumerAckPolicy: partial?.consumerAckPolicy,
  });
}
