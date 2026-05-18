import { symmetricJwtSecretFromEnv } from '@eshop/auth';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

const DEFAULT_ISSUER = 'http://localhost:5051';
const DEFAULT_EXPIRES_SECONDS = 60 * 60;

export type AccessTokenPayload = {
  sub: string;
  name: string;
  preferred_username: string;
  email: string;
  scope: string;
};

@Injectable()
export class AccessTokenIssuerService {
  constructor(private readonly jwt: JwtService) {}

  issueForUser(user: { id: string; email: string; displayName: string }): {
    access_token: string;
    token_type: 'Bearer';
    expires_in: number;
  } {
    const payload: AccessTokenPayload = {
      sub: user.id,
      name: user.displayName,
      preferred_username: user.email,
      email: user.email,
      scope: 'openid profile orders basket',
    };

    const expiresIn = Number(process.env.ESHOP_JWT_EXPIRES_SECONDS ?? DEFAULT_EXPIRES_SECONDS);
    const access_token = this.jwt.sign(payload, {
      expiresIn,
      issuer: process.env.ESHOP_IDENTITY_ISSUER_URL?.trim() || DEFAULT_ISSUER,
    });

    return {
      access_token,
      token_type: 'Bearer',
      expires_in: expiresIn,
    };
  }
}

export function jwtModuleSecret(): string {
  return symmetricJwtSecretFromEnv();
}
