import type { NestServiceCatalogEntry } from './types';
import defaultServices from './local-nest-services.json';

export function parseNestServicesJson(raw: string | undefined): NestServiceCatalogEntry[] {
  if (!raw?.trim()) return defaultServices as NestServiceCatalogEntry[];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return defaultServices as NestServiceCatalogEntry[];
    return parsed
      .map((entry) => entry as Partial<NestServiceCatalogEntry>)
      .filter(
        (entry) =>
          typeof entry.id === 'string' &&
          typeof entry.title === 'string' &&
          typeof entry.healthUrl === 'string',
      ) as NestServiceCatalogEntry[];
  } catch {
    return defaultServices as NestServiceCatalogEntry[];
  }
}

export function loadDefaultNestServices(): NestServiceCatalogEntry[] {
  return defaultServices as NestServiceCatalogEntry[];
}
