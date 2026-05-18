/** Decode JWT payload without verification (UX helper for display name and buyer id). */

function decodeJwtPayload(compact: string): Record<string, unknown> | null {
  try {
    const parts = compact.trim().split('.');
    if (parts.length < 2) return null;
    const json = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** True when `exp` is in the past (or missing / unparsable — treated as expired for API calls). */
export function isJwtExpired(compact: string): boolean {
  const payload = decodeJwtPayload(compact);
  if (!payload) return true;
  const exp = payload.exp;
  if (typeof exp !== 'number' || !Number.isFinite(exp)) return true;
  return exp * 1000 <= Date.now();
}

export function parseJwtSub(compact: string): string | null {
  const payload = decodeJwtPayload(compact);
  if (!payload) return null;
  const sub = payload.sub != null ? String(payload.sub) : '';
  return sub.length ? sub : null;
}

export function parseJwtDisplayName(compact: string): string | null {
  const payload = decodeJwtPayload(compact);
  if (!payload) return null;
  try {
    const typed = payload as {
      name?: string;
      preferred_username?: string;
      unique_name?: string;
      sub?: string;
    };
    const candidates = [typed.name, typed.preferred_username, typed.unique_name, typed.sub];
    for (const c of candidates) {
      const s = c != null ? String(c).trim() : '';
      if (s.length) return s;
    }
    return null;
  } catch {
    return null;
  }
}
