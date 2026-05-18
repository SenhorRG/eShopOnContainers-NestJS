import { Injectable } from '@nestjs/common';
import type { Metadata } from '@grpc/grpc-js';

import {
  extractBearerFromGrpcMetadata,
  symmetricJwtSecretFromEnv,
  verifyEshopAccessToken,
  verifyOptionsFromSharedIdentityEnv,
} from '@eshop/auth';

@Injectable()
export class BasketGrpcIdentityService {
  private readonly verifyOpts = verifyOptionsFromSharedIdentityEnv(
    symmetricJwtSecretFromEnv('ESHOP_BASKET_JWT_SECRET'),
  );

  async tryBuyerIdFromMetadata(metadata: Metadata | undefined): Promise<string | null> {
    const token = extractBearerFromGrpcMetadata(metadata);
    if (!token) return null;

    const principal = await verifyEshopAccessToken(token, this.verifyOpts);
    const sub = principal?.sub.trim() ?? '';

    return sub.length ? sub : null;
  }
}
