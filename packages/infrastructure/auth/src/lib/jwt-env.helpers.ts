/** Split comma / semicolon-separated env lists (JWT issuers, etc.). */

export function splitDelimitedEnvList(raw?: string): string[] {
  return (raw ?? '')
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}
