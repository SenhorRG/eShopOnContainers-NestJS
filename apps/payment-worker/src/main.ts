import 'reflect-metadata';
import { bootstrapEshopHttpMicroservice } from '@eshop/observability';

void bootstrapEshopHttpMicroservice(async () => (await import('./app.module')).AppModule, {
  tracingServiceName: 'payment-worker',
  defaultPort: 5066,
});
