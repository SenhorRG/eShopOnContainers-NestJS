/**
 * Resolves HS256 material from environment only (no literals in source).
 * Prefer `ESHOP_JWT_SYMMETRIC_SECRET`; service-specific keys are optional overrides.
 */
export function symmetricJwtSecretFromEnv(...legacyEnvKeys: string[]): string {
  const primary =
    process.env.ESHOP_JWT_SYMMETRIC_SECRET?.trim() || process.env.ESHOP_JWT_SECRET?.trim();
  if (primary) {
    return primary;
  }

  for (const key of legacyEnvKeys) {
    const value = process.env[key]?.trim();
    if (value) {
      return value;
    }
  }

  throw new Error(
    `Missing JWT symmetric secret. Set ESHOP_JWT_SYMMETRIC_SECRET (see .env.example).` +
      (legacyEnvKeys.length ? ` Optional: ${legacyEnvKeys.join(', ')}.` : ''),
  );
}
