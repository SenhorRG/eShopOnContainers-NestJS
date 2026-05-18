import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { PrismaClient } from '../../generated/webhooks-prisma';

/** Single PrismaClient for `@eshop/webhooks-service`; schema `webhooks`. */
@Injectable()
export class WebhooksPrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(WebhooksPrismaService.name);

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
    } catch (err) {
      this.log.warn(
        String((err as Error).message ?? err),
        'WebhooksPrisma optional connect failed — webhook consumers degrade until Postgres is reachable',
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect().catch(() => undefined);
  }
}
