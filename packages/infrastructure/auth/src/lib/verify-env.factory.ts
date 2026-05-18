import type { VerifyEshopAccessTokenOptions } from './access-token.verify';
import { splitDelimitedEnvList } from './jwt-env.helpers';

/**
 * Shared IdP knobs (JWKS URI, issuer allow-list, audience policy) mirrored from reference
 * `AuthenticationExtensions`: audience validation remains **off by default**.
 */
export function verifyOptionsFromSharedIdentityEnv(
  symmetricFallbackSecret: string,
): VerifyEshopAccessTokenOptions {
  const jwks = process.env.ESHOP_JWT_JWKS_URI?.trim();

  const sym =
    process.env.ESHOP_JWT_SYMMETRIC_SECRET?.trim() ||
    process.env.ESHOP_JWT_SECRET?.trim() ||
    symmetricFallbackSecret;

  const validIssuers = splitDelimitedEnvList(process.env.ESHOP_JWT_ISSUERS);
  const audience = process.env.ESHOP_JWT_AUDIENCE?.trim();
  const validateAudience = (process.env.ESHOP_JWT_VALIDATE_AUDIENCE ?? '').toLowerCase() === 'true';

  if (jwks?.length) {
    return {
      jwksUri: jwks,
      symmetricSecret: undefined,
      validIssuers: validIssuers.length ? validIssuers : undefined,
      audience: audience?.length ? audience : undefined,
      validateAudience,
    };
  }

  return {
    symmetricSecret: sym,
    validIssuers: validIssuers.length ? validIssuers : undefined,
    audience: audience?.length ? audience : undefined,
    validateAudience,
  };
}
