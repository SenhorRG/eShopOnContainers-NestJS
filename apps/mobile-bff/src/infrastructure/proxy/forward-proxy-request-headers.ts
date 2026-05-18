import type { ClientRequest, IncomingMessage } from 'node:http';

export function forwardProxyRequestHeaders(proxyReq: ClientRequest, req: IncomingMessage): void {
  const authorization = req.headers.authorization;
  if (typeof authorization === 'string' && authorization.length > 0) {
    proxyReq.setHeader('authorization', authorization);
  }

  const correlationId = req.headers['x-correlation-id'];
  if (typeof correlationId === 'string' && correlationId.length > 0) {
    proxyReq.setHeader('x-correlation-id', correlationId);
  }

  const traceparent = req.headers.traceparent;
  if (typeof traceparent === 'string' && traceparent.length > 0) {
    proxyReq.setHeader('traceparent', traceparent);
  }

  const tracestate = req.headers.tracestate;
  if (typeof tracestate === 'string' && tracestate.length > 0) {
    proxyReq.setHeader('tracestate', tracestate);
  }
}
