/** Detects Prisma P2002 (unique constraint) without coupling to @prisma/client. */
export function isUniqueConstraintViolation(err: unknown): boolean {
  if (typeof err !== 'object' || err === null || !('code' in err)) {
    return false;
  }
  return String((err as { code: string }).code) === 'P2002';
}
