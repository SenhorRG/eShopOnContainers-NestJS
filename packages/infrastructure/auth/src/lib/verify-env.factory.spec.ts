import { afterEach, describe, expect, it } from 'vitest';

import { verifyOptionsFromSharedIdentityEnv } from './verify-env.factory';

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('verifyOptionsFromSharedIdentityEnv', () => {
  it('prefers JWKS when ESHOP_JWT_JWKS_URI is set', () => {
    process.env.ESHOP_JWT_JWKS_URI =
      'http://localhost:8081/realms/eshop/protocol/openid-connect/certs';
    process.env.ESHOP_JWT_ISSUERS = 'http://localhost:8081/realms/eshop';
    process.env.ESHOP_JWT_SYMMETRIC_SECRET = 'local-secret';

    const opts = verifyOptionsFromSharedIdentityEnv('fallback');

    expect(opts.jwksUri).toContain('/protocol/openid-connect/certs');
    expect(opts.symmetricSecret).toBeUndefined();
    expect(opts.validIssuers).toEqual(['http://localhost:8081/realms/eshop']);
  });

  it('falls back to symmetric secret without JWKS', () => {
    delete process.env.ESHOP_JWT_JWKS_URI;
    process.env.ESHOP_JWT_SYMMETRIC_SECRET = 'from-env';

    const opts = verifyOptionsFromSharedIdentityEnv('fallback-secret');

    expect(opts.jwksUri).toBeUndefined();
    expect(opts.symmetricSecret).toBe('from-env');
  });
});
