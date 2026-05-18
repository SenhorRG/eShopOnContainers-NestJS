import type * as AmqpLib from 'amqplib';

/** Dead-letter exchange for integration-event consumer queues. */
export const ESHOP_EVENT_BUS_DLX = 'eshop_event_bus_dlx';

export function deadLetterQueueName(subscriptionQueueName: string): string {
  return `${subscriptionQueueName}.dlq`;
}

/**
 * Declares DLX + per-subscription DLQ and binds the main queue with dead-letter routing.
 * Idempotent: safe to call on every channel setup.
 */
export async function declareRabbitDeadLetterTopology(
  channel: AmqpLib.Channel,
  subscriptionQueueName: string,
): Promise<void> {
  const dlqName = deadLetterQueueName(subscriptionQueueName);

  await channel.assertExchange(ESHOP_EVENT_BUS_DLX, 'direct', { durable: true });
  await channel.assertQueue(dlqName, { durable: true, exclusive: false, autoDelete: false });
  await channel.bindQueue(dlqName, ESHOP_EVENT_BUS_DLX, subscriptionQueueName);

  await channel.assertQueue(subscriptionQueueName, {
    durable: true,
    exclusive: false,
    autoDelete: false,
    arguments: {
      'x-dead-letter-exchange': ESHOP_EVENT_BUS_DLX,
      'x-dead-letter-routing-key': subscriptionQueueName,
    },
  });
}
