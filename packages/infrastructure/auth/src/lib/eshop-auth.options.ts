/** Injected into {@link EshopJwtStrategy}. */
export type EshopAuthModuleOptions = {
  /** HS256 dev / shared secret between services when JWKS is not used. */
  symmetricSecret: string;
  /** OIDC JWKS document (RS256). When set, `symmetricSecret` is ignored for Passport validation. */
  jwksUri?: string;
  /** Optional issuers (comma env `ESHOP_JWT_ISSUERS` can be split by callers). */
  validIssuers?: string[];
  audience?: string;
  /** Default `false` (reference JWT bearer config). */
  validateAudience?: boolean;
};

export const ESHOP_AUTH_MODULE_OPTIONS = 'ESHOP_AUTH_MODULE_OPTIONS';
