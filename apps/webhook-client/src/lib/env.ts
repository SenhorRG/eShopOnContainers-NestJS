export function apiBase(raw: string | undefined, fallback: string): string {
  const v = (raw ?? '').trim();
  const u = v.length ? v : fallback;
  return u.replace(/\/$/, '');
}
