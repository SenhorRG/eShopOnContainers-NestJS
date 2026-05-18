import jwt, { type JwtPayload } from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';

import { mapJwtPayloadToEshopUser, type EshopRequestUser } from './claims.mapper';

export type VerifyEshopAccessTokenOptions = {
  symmetricSecret?: string;
  jwksUri?: string;
  validIssuers?: string[];
  audience?: string;
  /** Default `false`, matching reference `AuthenticationExtensions` (`ValidateAudience = false`). */
  validateAudience?: boolean;
};

function verifyOptsBase(cfg: VerifyEshopAccessTokenOptions): jwt.VerifyOptions {
  const opt: jwt.VerifyOptions = {
    algorithms: cfg.jwksUri?.trim() ? ['RS256'] : ['HS256'],
  };

  if (cfg.validIssuers?.length) {
    opt.issuer =
      cfg.validIssuers.length === 1 ? (cfg.validIssuers[0] as string) : (cfg.validIssuers as jwt.VerifyOptions['issuer']);
  }

  const validateAudience = cfg.validateAudience ?? false;
  if (validateAudience && cfg.audience?.trim()) {
    opt.audience = cfg.audience;
  }

  return opt;
}

async function verifyWithJwks(
  compactJwt: string,
  cfg: Required<Pick<VerifyEshopAccessTokenOptions, 'jwksUri'>> & VerifyEshopAccessTokenOptions,
): Promise<EshopRequestUser | null> {
  const client = jwksRsa({
    cache: true,
    cacheMaxAge: 60 * 60 * 1000,
    rateLimit: true,
    jwksRequestsPerMinute: 10,
    jwksUri: cfg.jwksUri,
  });

  const getSigningKey: jwt.GetPublicKeyOrSecret = (header, callback) => {
    const kid = header.kid;
    if (!kid) {
      callback(new Error('JWT header missing kid'));
      return;
    }
    client.getSigningKey(kid, (err, key) => {
      if (err) {
        callback(err);
        return;
      }
      const signingKey = key?.getPublicKey();
      if (!signingKey) {
        callback(new Error('Unable to resolve signing key'));
        return;
      }
      callback(null, signingKey);
    });
  };

  return new Promise((resolve) => {
    jwt.verify(compactJwt, getSigningKey, verifyOptsBase(cfg), (err, decoded) => {
      if (err || typeof decoded !== 'object' || decoded === null) {
        resolve(null);
        return;
      }
      resolve(mapJwtPayloadToEshopUser(decoded as JwtPayload));
    });
  });
}

/**
 * Validates a Bearer access-token string (opaque to HTTP vs gRPC). Used by gRPC metadata paths
 * without pulling in Passport.
 */
export async function verifyEshopAccessToken(
  compactJwt: string,
  cfg: VerifyEshopAccessTokenOptions,
): Promise<EshopRequestUser | null> {
  const trimmed = compactJwt.trim();
  if (!trimmed.length) return null;

  const jwks = cfg.jwksUri?.trim();
  if (jwks?.length) {
    return verifyWithJwks(trimmed, { ...cfg, jwksUri: jwks });
  }

  const secret = cfg.symmetricSecret?.trim();
  if (!secret?.length) return null;

  try {
    const decoded = jwt.verify(trimmed, secret, verifyOptsBase(cfg));
    if (typeof decoded !== 'object' || decoded === null) return null;
    return mapJwtPayloadToEshopUser(decoded as JwtPayload);
  } catch {
    return null;
  }
}
