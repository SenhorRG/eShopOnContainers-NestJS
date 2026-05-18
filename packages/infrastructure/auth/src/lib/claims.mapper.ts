export type JwtPayloadLike = {
  sub?: string;
  name?: string;
  preferred_username?: string;
  email?: string;
  /** Standard OIDC / Duende scopes may appear as `scope` claim (space-delimited string). */
  scope?: string;
  /*
   * Typical resource-specific audience claims (`aud`).
   */
  aud?: string | string[];
};

/**
 * HTTP `req.user` shape aligned with the reference notion of extracting `sub` from JWT
 * (`ClaimsPrincipalExtensions.GetUserId` reads `sub` without remapping NameIdentifier).
 */
export type EshopRequestUser = {
  sub: string;
  username: string;
  scopes: string[];
  raw: JwtPayloadLike;
};

function parseScopes(raw?: string): string[] {
  if (!raw?.trim()) return [];
  return raw.trim().split(/\s+/).filter(Boolean);
}

export function mapJwtPayloadToEshopUser(payload: JwtPayloadLike): EshopRequestUser {
  return {
    sub: String(payload.sub ?? ''),
    username: String(payload.name ?? payload.preferred_username ?? ''),
    scopes: parseScopes(payload.scope),
    raw: payload,
  };
}
