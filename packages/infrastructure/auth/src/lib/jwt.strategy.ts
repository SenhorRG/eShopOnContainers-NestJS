import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { passportJwtSecret } from 'jwks-rsa';
import { ExtractJwt, Strategy, type StrategyOptionsWithoutRequest } from 'passport-jwt';

import { mapJwtPayloadToEshopUser, type JwtPayloadLike } from './claims.mapper';
import { ESHOP_AUTH_MODULE_OPTIONS, type EshopAuthModuleOptions } from './eshop-auth.options';

function buildJwtStrategyOptions(opts: EshopAuthModuleOptions): StrategyOptionsWithoutRequest {
  const jwksUri = opts.jwksUri?.trim();

  const verifyBase: Pick<StrategyOptionsWithoutRequest, 'jwtFromRequest' | 'ignoreExpiration'> = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    ignoreExpiration: false,
  };

  if (jwksUri?.length) {
    const issuer =
      opts.validIssuers?.length === 1
        ? opts.validIssuers[0]
        : opts.validIssuers?.length
          ? opts.validIssuers
          : undefined;

    return {
      ...verifyBase,
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
        jwksUri,
      }),
      algorithms: ['RS256'],
      issuer,
      audience: opts.validateAudience && opts.audience?.trim() ? opts.audience : undefined,
    };
  }

  return {
    ...verifyBase,
    secretOrKey: opts.symmetricSecret,
    algorithms: ['HS256'],
    issuer:
      opts.validIssuers?.length === 1
        ? opts.validIssuers[0]
        : opts.validIssuers?.length
          ? opts.validIssuers
          : undefined,
    audience: opts.validateAudience && opts.audience?.trim() ? opts.audience : undefined,
  };
}

/**
 * Shared Passport JWT strategy for `@eshop/*` HTTP APIs (equivalent role to reference
 * `AddDefaultAuthentication().AddJwtBearer(...)` when an `Identity` configuration section exists).
 */
@Injectable()
export class EshopJwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(@Inject(ESHOP_AUTH_MODULE_OPTIONS) opts: EshopAuthModuleOptions) {
    super(buildJwtStrategyOptions(opts));
  }

  validate(payload: JwtPayloadLike) {
    return mapJwtPayloadToEshopUser(payload);
  }
}
