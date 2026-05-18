import type { ClientRequest, IncomingMessage } from 'node:http';
import { describe, expect, it, vi } from 'vitest';

import { forwardProxyRequestHeaders } from './forward-proxy-request-headers';

describe('forwardProxyRequestHeaders', () => {
  it('forwards auth, correlation, and W3C trace headers', () => {
    const setHeader = vi.fn<(name: string, value: string) => void>();
    const proxyReq = { setHeader } as unknown as ClientRequest;
    const req = {
      headers: {
        authorization: 'Bearer token',
        'x-correlation-id': 'corr-42',
        traceparent: '00-trace-span-01',
        tracestate: 'vendor=value',
      },
    } as IncomingMessage;

    forwardProxyRequestHeaders(proxyReq, req);

    expect(setHeader).toHaveBeenCalledWith('authorization', 'Bearer token');
    expect(setHeader).toHaveBeenCalledWith('x-correlation-id', 'corr-42');
    expect(setHeader).toHaveBeenCalledWith('traceparent', '00-trace-span-01');
    expect(setHeader).toHaveBeenCalledWith('tracestate', 'vendor=value');
  });
});
