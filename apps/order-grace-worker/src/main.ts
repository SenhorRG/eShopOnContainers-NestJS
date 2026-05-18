import 'reflect-metadata';

import { bootstrapEshopNestWorker } from '@eshop/observability';

import { GracePeriodManagerService } from './application/grace-period.manager';

void bootstrapEshopNestWorker(async () => (await import('./app.module')).AppModule, {
  serviceName: 'order-grace-worker',
  defaultPort: 5065,
  onApplicationReady: (app) => {
    app.get(GracePeriodManagerService).beginAfterBusReady();
  },
});
