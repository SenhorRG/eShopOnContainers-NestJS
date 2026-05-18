import { readFileSync } from 'node:fs';
import { join } from 'node:path';

let cachedAliases: Record<string, string> | null = null;

function loginAliasesFixturePath(): string {
  return join(process.cwd(), 'prisma', 'fixtures', 'login-aliases.json');
}

function loadLoginAliases(): Record<string, string> {
  if (cachedAliases) return cachedAliases;
  try {
    const parsed = JSON.parse(readFileSync(loginAliasesFixturePath(), 'utf8')) as Record<string, string>;
    cachedAliases = Object.fromEntries(
      Object.entries(parsed).map(([alias, email]) => [alias.trim().toLowerCase(), email.trim().toLowerCase()]),
    );
  } catch {
    cachedAliases = {};
  }
  return cachedAliases;
}

export function resolveLoginEmail(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed.length) {
    return trimmed;
  }

  if (!trimmed.includes('@')) {
    return loadLoginAliases()[trimmed] ?? trimmed;
  }

  return trimmed;
}
