import type { LocalResourceCatalog } from './types';

export function validateLocalResourceCatalog(value: unknown): value is LocalResourceCatalog {
  if (!value || typeof value !== 'object') return false;
  const catalog = value as LocalResourceCatalog;
  if (!Array.isArray(catalog.resources) || !Array.isArray(catalog.edges)) return false;

  for (const resource of catalog.resources) {
    if (!resource?.id || !resource.title || !resource.kind || !Array.isArray(resource.composeProfiles)) {
      return false;
    }
  }

  for (const edge of catalog.edges) {
    if (!edge?.from || !edge.to || !edge.relation) return false;
  }

  return true;
}
