import { describe, expect, it } from 'vitest';

import { buildConnectionUri } from './rabbit-uri';

describe('buildConnectionUri', () => {
  it('encodes default vhost as %2F', () => {
    const uri = buildConnectionUri({
      hostname: 'localhost',
      port: 5672,
      username: 'guest',
      password: 'guest',
    });
    expect(uri).toBe('amqp://guest:guest@localhost:5672/%2F');
  });

  it('encodes special characters in credentials', () => {
    const uri = buildConnectionUri({
      hostname: 'h',
      port: 5672,
      username: 'a@b',
      password: 'p:word',
      vhost: '/prod',
    });
    expect(uri).toContain(encodeURIComponent('a@b'));
    expect(uri).toContain(encodeURIComponent('p:word'));
    expect(uri).toContain(encodeURIComponent('/prod'));
  });
});
