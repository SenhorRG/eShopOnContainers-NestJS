import amqp from 'amqp-connection-manager';
import {
  context,
  trace,
  SpanKind,
  type Context as OtelContext,
  type Span,
} from '@opentelemetry/api';
import { createRabbitIntegrationMeters } from '@eshop/observability';
import type * as AmqpLib from 'amqplib';
import type { ConsumeMessage } from 'amqplib';

import { ESHOP_EVENT_BUS_EXCHANGE, ESHOP_EVENT_BUS_EXCHANGE_TYPE } from './constants';
import { declareRabbitDeadLetterTopology } from './rabbitmq-dlq-topology';
import type { ConsumerAckPolicy, EventBusOptions } from './event-bus-options';
import type { IEventBus } from './event-bus.interface';
import type { IntegrationEvent } from './integration-event-base';
import type { MinimalLogger } from './minimal-logger';
import { withPublishRetry } from './publish-retry';
import { buildConnectionUri } from './rabbit-uri';
import { RabbitMqTelemetry } from './rabbitmq-telemetry';
import type { SubscriptionRegistry } from './subscription-registry';

function stringifyEvent(event: IntegrationEvent): Buffer {
  return Buffer.from(JSON.stringify(event));
}

export class RabbitMqEventBus implements IEventBus {
  private connection?: ReturnType<typeof amqp.connect>;
  private publisher?: ReturnType<ReturnType<typeof amqp.connect>['createChannel']>;
  private consumer?: ReturnType<ReturnType<typeof amqp.connect>['createChannel']>;
  private readonly meters = createRabbitIntegrationMeters();

  constructor(
    private readonly options: EventBusOptions,
    private readonly subscriptions: SubscriptionRegistry,
    private readonly telemetry: RabbitMqTelemetry,
    private readonly logger: MinimalLogger = {},
  ) {}

  async start(): Promise<void> {
    const uri = buildConnectionUri(this.options.connection);
    this.connection = amqp.connect([uri], {
      heartbeatIntervalInSeconds: this.options.connection.heartbeatIntervalInSeconds ?? 30,
      reconnectTimeInSeconds: 2,
    });

    this.publisher = this.connection.createChannel({
      confirm: false,
      json: false,
      setup: async (channel: AmqpLib.Channel) => {
        await channel.assertExchange(ESHOP_EVENT_BUS_EXCHANGE, ESHOP_EVENT_BUS_EXCHANGE_TYPE, {
          durable: true,
        });
      },
    });

    await this.publisher.waitForConnect();

    const queueName = this.options.subscriptionClientName;

    this.consumer = this.connection.createChannel({
      json: false,
      setup: async (channel: AmqpLib.Channel) => {
        await channel.assertExchange(ESHOP_EVENT_BUS_EXCHANGE, ESHOP_EVENT_BUS_EXCHANGE_TYPE, {
          durable: true,
        });

        await declareRabbitDeadLetterTopology(channel, queueName);

        await channel.prefetch(this.options.prefetch ?? 10);

        for (const rk of this.subscriptions.getKeys()) {
          await channel.bindQueue(queueName, ESHOP_EVENT_BUS_EXCHANGE, rk);
        }

        await channel.consume(queueName, (msg: ConsumeMessage | null) => void this.onMessage(channel, msg), {
          noAck: false,
        });
      },
    });

    await this.consumer.waitForConnect();
    this.logger.trace?.('RabbitMqEventBus started wiring', {
      exchange: ESHOP_EVENT_BUS_EXCHANGE,
      queue: queueName,
    });
  }

  async stop(): Promise<void> {
    await this.publisher?.close();
    await this.consumer?.close();
    await this.connection?.close();
    this.publisher = undefined;
    this.consumer = undefined;
    this.connection = undefined;
  }

  async publish(event: IntegrationEvent): Promise<void> {
    if (!this.publisher) {
      throw new Error('RabbitMqEventBus.publish called before start()');
    }

    const routingKey = event.routingKey;
    const body = stringifyEvent(event);

    await withPublishRetry(this.options.retryCount, async () =>
      context.with(context.active(), async () => {
        const tracer = this.telemetry.getTracer();
        const publishStarted = Date.now();
        await tracer.startActiveSpan(`${routingKey} publish`, { kind: SpanKind.PRODUCER }, async (span: Span) => {
          try {
            span.setAttribute('messaging.system', 'rabbitmq');
            span.setAttribute('messaging.destination.name', routingKey);
            span.setAttribute('messaging.rabbitmq.routing_key', routingKey);
            span.setAttribute('messaging.operation', 'publish');

            const carrier: Record<string, string> = {};
            this.telemetry.injectTraceContext(carrier);

            const props: AmqpLib.Options.Publish = {
              persistent: true,
              mandatory: true,
              headers: { ...carrier } as Record<string, unknown>,
            };

            await this.publisher!.publish(ESHOP_EVENT_BUS_EXCHANGE, routingKey, body, props);
          } catch (err) {
            span.recordException(err as Error);
            throw err;
          } finally {
            this.meters.publishDurationMs.record(Date.now() - publishStarted, {
              'messaging.destination.name': routingKey,
            });
            span.end();
          }
        });
      }),
    );
  }

  private async onMessage(channel: AmqpLib.Channel, msg: ConsumeMessage | null): Promise<void> {
    if (!msg) return;

    const ackPolicy: ConsumerAckPolicy = this.options.consumerAckPolicy ?? 'always';

    const parentCtx: OtelContext = this.telemetry.extractContext(
      msg.properties.headers as Record<string, unknown> | undefined,
    );
    const routingKey = msg.fields.routingKey ?? '';
    const utf8Body = msg.content.toString('utf8');

    await context.with(parentCtx, async () => {
      const tracer = this.telemetry.getTracer();

      await tracer.startActiveSpan(`${routingKey || 'unknown'} receive`, { kind: SpanKind.CONSUMER }, async (span: Span) => {
        span.setAttribute('messaging.system', 'rabbitmq');
        span.setAttribute('messaging.destination.name', routingKey);
        span.setAttribute('messaging.rabbitmq.routing_key', routingKey);
        span.setAttribute('messaging.operation', 'receive');
        span.setAttribute('message.size', utf8Body.length);

        let handlerRejected = false;
        let finalizeSuccessPath = true;

        try {
          let parsed: Record<string, unknown>;
          try {
            parsed = JSON.parse(utf8Body) as Record<string, unknown>;
          } catch (e) {
            this.logger.warn?.('Invalid integration JSON envelope', {
              routingKey,
              detail: String((e as Error).message ?? e),
            });
            span.recordException(e as Error);
            return;
          }

          const bucket = this.subscriptions.resolve(routingKey);
          if (!bucket) {
            this.logger.warn?.('Unable to resolve integration handler bucket', { routingKey });
            return;
          }

          let integrationEvent: IntegrationEvent;
          try {
            integrationEvent = bucket.revive(parsed);
          } catch (e) {
            this.logger.warn?.('Integration revive threw', {
              routingKey,
              detail: String((e as Error).message ?? e),
            });
            span.recordException(e as Error);
            return;
          }

          await tracer.startActiveSpan(`${routingKey} process`, async (childSpan: Span) => {
            const processStarted = Date.now();
            try {
              childSpan.setAttribute('messaging.system', 'rabbitmq');
              childSpan.setAttribute('messaging.destination.name', routingKey);
              childSpan.setAttribute('messaging.operation', 'process');
              for (const handler of bucket.handlers) {
                await handler.handle(integrationEvent);
              }
            } catch (handlerErr) {
              handlerRejected = true;
              this.logger.warn?.('Integration handler threw', {
                routingKey,
                detail: String((handlerErr as Error).stack ?? handlerErr),
              });
              childSpan.recordException(handlerErr as Error);
              throw handlerErr;
            } finally {
              this.meters.consumeProcessDurationMs.record(Date.now() - processStarted, {
                'messaging.destination.name': routingKey,
              });
              childSpan.end();
            }
          });
        } catch (outerErr) {
          finalizeSuccessPath = false;
          this.logger.warn?.('Unexpected Rabbit consumer failure', {
            routingKey,
            detail: String((outerErr as Error).stack ?? outerErr),
          });
          span.recordException(outerErr as Error);
        } finally {
          span.end();

          try {
            if (ackPolicy === 'always') {
              channel.ack(msg);
            } else if (handlerRejected || !finalizeSuccessPath) {
              channel.nack(msg, false, true);
            } else {
              channel.ack(msg);
            }
          } catch (e) {
            const detail = String((e as Error)?.message ?? e);
            if (!detail.includes('Channel closing') && !detail.includes('Illegal operation')) {
              throw e;
            }
          }
        }
      });
    });
  }
}
