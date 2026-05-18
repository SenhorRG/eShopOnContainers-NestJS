import { Injectable } from '@nestjs/common';

import { WebhookType } from '../domain/webhook-type';
import type { WebhookSubscription } from '../../generated/webhooks-prisma';

import { WebhooksPrismaService } from '../../infrastructure/prisma/webhooks-prisma.service';

/** Port of reference `WebhooksRetriever`. */
@Injectable()
export class WebhooksRetrieverService {
  constructor(private readonly prisma: WebhooksPrismaService) {}

  async getSubscriptionsOfType(type: WebhookType): Promise<WebhookSubscription[]> {
    return this.prisma.webhookSubscription.findMany({
      where: { type },
    });
  }
}
