import { DynamicModule, Global, Module, RequestMethod } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';

import { createStructuredLogProps } from './structured-log-props';
import { resolvePinoOtelTransport } from './resolve-pino-otel-transport';

@Global()
@Module({})
export class ObservabilityModule {
  static forRoot(): DynamicModule {
    const raw = process.env.LOG_LEVEL?.trim();
    const level =
      raw && raw.length > 0
        ? raw
        : String(process.env.NODE_ENV).toLowerCase() === 'production'
          ? 'info'
          : 'debug';

    const transport = resolvePinoOtelTransport();

    return {
      module: ObservabilityModule,
      imports: [
        LoggerModule.forRoot({
          forRoutes: [{ path: '*path', method: RequestMethod.ALL }],
          pinoHttp: {
            level,
            customProps: (req) => createStructuredLogProps(req),
            ...(transport ? { transport } : {}),
          },
        }),
      ],
      exports: [LoggerModule],
    };
  }
}
