export function parseJwtSub(token: string): string | null {
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'),
    ) as { sub?: string };
    return payload.sub?.trim().length ? String(payload.sub) : null;
  } catch {
    return null;
  }
}
