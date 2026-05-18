import { Injectable } from '@nestjs/common';
import type { WebhookSubscription } from '../../generated/webhooks-prisma';
import { axiosWithPolicy, createResilientAxios } from '@eshop/http-resilience';
import type { ResilientAxiosPolicy } from '@eshop/http-resilience';

import type { WebhookWirePayload } from '../domain/webhook-data';

import { runWithConcurrency } from './run-with-concurrency';

/**
 * Port of reference `WebhooksSender` with resilience:
 * retry + timeout + **circuit breaker per destination URL** (see `policyFor`).
 *
 * Headers: never log raw `X-eshop-whtoken` values.
 */
@Injectable()
export class WebhooksSenderService {
  private readonly policies = new Map<string, ResilientAxiosPolicy>();

  async sendAll(receivers: Iterable<WebhookSubscription>, data: WebhookWirePayload): Promise<void> {
    const list = [...receivers];
    const json = JSON.stringify(data);

    const concurrency = Math.max(
      1,
      Math.floor(Number(process.env.ESHOP_WEBHOOKS_DISPATCH_CONCURRENCY ?? '8')),
    );

    await runWithConcurrency(list, concurrency, async (subscription) => {
      await this.onSendData(subscription, json);
    });
  }

  private policyFor(destUrl: string): ResilientAxiosPolicy {
    let p = this.policies.get(destUrl);
    if (!p) {
      p = createResilientAxios('webhookOutbound');
      this.policies.set(destUrl, p);
    }
    return p;
  }

  private async onSendData(subs: WebhookSubscription, jsonData: string): Promise<void> {
    const policy = this.policyFor(subs.destUrl);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (subs.token && subs.token.trim().length > 0) {
      headers['X-eshop-whtoken'] = subs.token;
    }

    await axiosWithPolicy(policy, {
      method: 'POST',
      url: subs.destUrl,
      data: jsonData,
      headers,
    });
  }
}
