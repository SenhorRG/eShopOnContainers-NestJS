import { Injectable, Logger } from '@nestjs/common';
import { axiosWithPolicy, createResilientAxios } from '@eshop/http-resilience';

/** Port of reference `GrantUrlTesterService` (OPTIONS + `X-eshop-whtoken` echo). */
@Injectable()
export class GrantUrlTesterService {
  private readonly log = new Logger(GrantUrlTesterService.name);

  private readonly policy = createResilientAxios('webhookOutbound');

  async testGrantUrl(urlHook: string, grantUrl: string, token: string): Promise<boolean> {
    if (!checkSameOrigin(urlHook, grantUrl)) {
      this.log.warn(`Hook URL and grant URL do not share same origin (${urlHook} vs ${grantUrl})`);
      return false;
    }

    const tokenPresent = token.length > 0;
    this.log.log(
      `OPTIONS grant probe ${grantUrl} tokenLen=${String(token.length)} expectedPresent=${String(tokenPresent)}`,
    );

    try {
      const response = await axiosWithPolicy(this.policy, {
        method: 'OPTIONS',
        url: grantUrl,
        headers: {
          'X-eshop-whtoken': token,
        },
        validateStatus: () => true,
      });

      const tokenReceivedRaw = response.headers['x-eshop-whtoken'];
      const tokenReceivedSingle = Array.isArray(tokenReceivedRaw) ? tokenReceivedRaw[0] : tokenReceivedRaw;
      const normalizedReceived =
        tokenReceivedSingle === undefined || tokenReceivedSingle === null || tokenReceivedSingle === ''
          ? undefined
          : String(tokenReceivedSingle);
      const tokenExpected = token.trim().length === 0 ? undefined : token;

      this.log.log(
        `Grant response status=${String(response.status)} url=${grantUrl} tokenReceivedLen=${String(normalizedReceived?.length ?? 0)}`,
      );

      return (
        response.status >= 200 &&
        response.status < 300 &&
        normalizedReceived === tokenExpected
      );
    } catch (err) {
      this.log.warn(
        `Grant OPTIONS failed (${(err as Error).name}) — url=${grantUrl}`,
      );
      return false;
    }
  }
}

export function checkSameOrigin(urlHook: string, grantUrl: string): boolean {
  try {
    const a = new URL(urlHook);
    const b = new URL(grantUrl);
    return a.protocol === b.protocol && a.host === b.host;
  } catch {
    return false;
  }
}
