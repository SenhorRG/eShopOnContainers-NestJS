# RabbitMQ — dead-letter queues (DLQ)

Consumer queues are declared by `@eshop/event-bus-amqp` when each service starts. Topology:

| Artifact | Name |
|----------|------|
| Main exchange | `eshop_event_bus` (direct) |
| Dead-letter exchange | `eshop_event_bus_dlx` (direct) |
| Per-service queue | e.g. `ordering-api` |
| Per-service DLQ | e.g. `ordering-api.dlq` |

Main queues set `x-dead-letter-exchange` → `eshop_event_bus_dlx` and `x-dead-letter-routing-key` → subscription queue name.

## Inspect DLQ (local Compose)

Management UI: http://localhost:55673 (guest/guest).

```bash
# List queues ending in .dlq
docker exec eshop-nestjs-rabbitmq-1 rabbitmqctl list_queues name messages
```

Messages land in the DLQ when a consumer **nacks without requeue** (see `consumerAckPolicy: afterHandlerSuccess`). Study default remains `always` (ack even on handler failure); switch policy per service when testing poison messages.

## Code reference

`packages/infrastructure/event-bus-amqp/src/rabbitmq-dlq-topology.ts`
