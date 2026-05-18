import { Server, createServer } from 'node:http';

import { describe, expect, it } from 'vitest';

import { axiosWithPolicy, createResilientAxios, describeNamedHttpPreset } from './http-client.factory';

describe('createResilientAxios', () => {
  it('exposes bffUpstream preset for mobile BFF aggregation', () => {
    expect(describeNamedHttpPreset('bffUpstream').timeoutMs).toBe(120_000);
    expect(describeNamedHttpPreset('bffUpstream').maxAttempts).toBe(2);
  });

  it('retries after 503 and completes with 200', async () => {
    let hits = 0;

    const server = createServer((_req, res) => {
      hits += 1;
      if (hits <= 3) {
        res.writeHead(503);
        res.end();
        return;
      }
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end('{"ok":true}');
    });

    await new Promise<void>((r) => server.listen(0, r));
    const { port } = (server.address() as { port: number });

    try {
      const resilient = createResilientAxios('webhookOutbound', { baseURL: `http://127.0.0.1:${port}` });
      const res = await axiosWithPolicy(resilient, { url: '/', method: 'get' });

      expect(hits).toBe(4);
      expect(res.status).toBe(200);
      expect(res.data).toEqual({ ok: true });
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve())),
      );
    }
  }, 15_000);

  it('fails immediately on 404 (axios error)', async () => {
    const server: Server = createServer((_req, res) => {
      res.writeHead(404);
      res.end();
    });
    await new Promise<void>((r) => server.listen(0, r));
    const { port } = (server.address() as { port: number });
    try {
      const resilient = createResilientAxios('webhookOutbound');
      await expect(
        axiosWithPolicy(resilient, {
          url: `http://127.0.0.1:${port}/nope`,
          method: 'get',
          timeout: 2000,
        }),
      ).rejects.toMatchObject({ isAxiosError: true });
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve())),
      );
    }
  });
});
