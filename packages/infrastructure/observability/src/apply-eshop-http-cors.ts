import type { INestApplication } from '@nestjs/common';

export function applyEshopHttpCors(app: INestApplication): void {
  const nodeEnv = String(process.env.NODE_ENV ?? '').toLowerCase();
  const explicitOrigins = (process.env.ESHOP_CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  if (explicitOrigins.length > 0) {
    app.enableCors({ origin: explicitOrigins, credentials: true });
    return;
  }

  if (nodeEnv !== 'production') {
    app.enableCors({ origin: true, credentials: true });
  }
}
