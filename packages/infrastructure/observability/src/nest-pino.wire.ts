import type { INestApplication } from '@nestjs/common';
import { Logger } from 'nestjs-pino';

/**
 * After `NestFactory.create(..., { bufferLogs: true })`, routes Nest logs through pino (`nestjs-pino`).
 */
export function useNestPinoLogger(app: INestApplication): void {
  app.useLogger(app.get(Logger));
}
