export function formatContextRoute(context: string, route: string): string {
  const parts: string[] = [];

  if (route && route !== '—') {
    parts.push(route);
  }
  if (context && context !== '—') {
    parts.push(context);
  }

  return parts.length > 0 ? parts.join(' · ') : '—';
}
