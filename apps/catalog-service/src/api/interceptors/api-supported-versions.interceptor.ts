import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import type { Response } from 'express';
import { tap } from 'rxjs';

/** Mirrors `builder.Services.AddApiVersioning({ ReportApiVersions = true })` response headers roughly. */
@Injectable()
export class ApiSupportedVersionsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      tap(() => {
        const res = context.switchToHttp().getResponse<Response>();
        res.setHeader('api-supported-versions', '1.0, 2.0');
      }),
    );
  }
}
