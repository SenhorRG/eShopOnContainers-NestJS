export { EshopAuthModule } from './lib/eshop-auth.module';
export { ESHOP_AUTH_MODULE_OPTIONS, type EshopAuthModuleOptions } from './lib/eshop-auth.options';
export { EshopJwtStrategy } from './lib/jwt.strategy';
export {
  mapJwtPayloadToEshopUser,
  type EshopRequestUser,
  type JwtPayloadLike,
} from './lib/claims.mapper';
export {
  verifyEshopAccessToken,
  type VerifyEshopAccessTokenOptions,
} from './lib/access-token.verify';
export { extractBearerFromGrpcMetadata } from './lib/grpc-bearer';
export { splitDelimitedEnvList } from './lib/jwt-env.helpers';
export { symmetricJwtSecretFromEnv } from './lib/symmetric-jwt-secret.env';
export { verifyOptionsFromSharedIdentityEnv } from './lib/verify-env.factory';
