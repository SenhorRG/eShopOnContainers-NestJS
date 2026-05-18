import { ValidationPipe, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Request } from 'express';
import { resolve } from 'path';
import request from 'supertest';

import { EventBusLifecycleService } from '@eshop/event-bus-amqp/nest';

import { AppModule } from '../src/app.module';
import { ApiSupportedVersionsInterceptor } from '../src/api/interceptors/api-supported-versions.interceptor';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';

describe('Catalog item picture (e2e)', () => {
  jest.setTimeout(120_000);

  let app: import('@nestjs/common').INestApplication;

  beforeAll(async () => {
    process.env.CATALOG_PICS_PATH = resolve(__dirname, '../assets/pics');

    const prismaStub = {
      catalogItem: {
        findUnique: jest.fn().mockResolvedValue({ Id: 1, PictureFileName: '1.webp' }),
      },
    };

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaStub as unknown as PrismaService)
      .overrideProvider(EventBusLifecycleService)
      .useValue({
        onModuleInit: async () => undefined,
        onModuleDestroy: async () => undefined,
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.enableVersioning({
      type: VersioningType.CUSTOM,
      defaultVersion: '1.0',
      extractor: (req: unknown) => {
        const r = req as Request;
        const q = r.query?.['api-version'];
        const fromQuery = Array.isArray(q) ? q[0] : q;
        if (typeof fromQuery === 'string' && fromQuery.length) return fromQuery;
        const h = r.headers['api-version'];
        const fromHeader = Array.isArray(h) ? h[0] : h;
        if (typeof fromHeader === 'string' && fromHeader.length) return fromHeader;
        return '1.0';
      },
    });
    app.setGlobalPrefix('api');
    app.useGlobalInterceptors(new ApiSupportedVersionsInterceptor());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidUnknownValues: false,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('GET /api/catalog/items/1/pic returns image/webp bytes', async () => {
    const res = await request(app.getHttpServer()).get('/api/catalog/items/1/pic').buffer(true).expect(200);

    expect(res.headers['content-type']).toMatch(/image\/webp/i);
    expect(Buffer.isBuffer(res.body)).toBe(true);
    expect((res.body as Buffer).length).toBeGreaterThan(0);
  });
});
