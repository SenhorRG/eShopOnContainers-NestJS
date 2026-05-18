import localResources from './local-resources.json';
import type { LocalResourceCatalog } from './types';

export function loadLocalResourceCatalog(): LocalResourceCatalog {
  return localResources as LocalResourceCatalog;
}
