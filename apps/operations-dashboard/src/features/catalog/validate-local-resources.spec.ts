import { describe, expect, it } from 'vitest';

import localResources from './local-resources.json';
import { validateLocalResourceCatalog } from './validate-local-resources';

describe('validateLocalResourceCatalog', () => {
  it('accepts the committed local resource catalog', () => {
    expect(validateLocalResourceCatalog(localResources)).toBe(true);
  });

  it('rejects malformed catalogs', () => {
    expect(validateLocalResourceCatalog({ resources: [], edges: 'bad' })).toBe(false);
  });
});
