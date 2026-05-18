import { describe, expect, it, vi } from 'vitest';

import {
  ESHOP_EVENT_BUS_DLX,
  deadLetterQueueName,
  declareRabbitDeadLetterTopology,
} from './rabbitmq-dlq-topology';

describe('declareRabbitDeadLetterTopology', () => {
  it('names DLQ from subscription queue', () => {
    expect(deadLetterQueueName('ordering-api')).toBe('ordering-api.dlq');
  });

  it('asserts DLX, DLQ bind, and main queue with dead-letter args', async () => {
    const channel = {
      assertExchange: vi.fn().mockResolvedValue(undefined),
      assertQueue: vi.fn().mockResolvedValue(undefined),
      bindQueue: vi.fn().mockResolvedValue(undefined),
    };

    await declareRabbitDeadLetterTopology(channel as never, 'catalog-api');

    expect(channel.assertExchange).toHaveBeenCalledWith(ESHOP_EVENT_BUS_DLX, 'direct', {
      durable: true,
    });
    expect(channel.assertQueue).toHaveBeenCalledWith('catalog-api.dlq', {
      durable: true,
      exclusive: false,
      autoDelete: false,
    });
    expect(channel.bindQueue).toHaveBeenCalledWith(
      'catalog-api.dlq',
      ESHOP_EVENT_BUS_DLX,
      'catalog-api',
    );
    expect(channel.assertQueue).toHaveBeenCalledWith('catalog-api', {
      durable: true,
      exclusive: false,
      autoDelete: false,
      arguments: {
        'x-dead-letter-exchange': ESHOP_EVENT_BUS_DLX,
        'x-dead-letter-routing-key': 'catalog-api',
      },
    });
  });
});
