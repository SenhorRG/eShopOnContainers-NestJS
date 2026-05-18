import { describe, expect, it } from 'vitest';

import { assertValidRegistration } from './registration.rules';
import { IdentityDomainException } from './identity-domain.exception';

describe('registration rules', () => {
  it('normalizes email', () => {
    const result = assertValidRegistration({
      email: ' User@Example.COM ',
      password: 'secret123',
      displayName: 'User',
    });
    expect(result.email.value).toBe('user@example.com');
  });

  it('rejects weak password', () => {
    expect(() =>
      assertValidRegistration({ email: 'a@b.co', password: 'short', displayName: 'User' }),
    ).toThrow(IdentityDomainException);
  });
});
