import { describe, expect, it } from 'vitest';

import { splitDelimitedEnvList } from './jwt-env.helpers';

describe('splitDelimitedEnvList', () => {
  it('splits comma-separated issuers', () => {
    expect(splitDelimitedEnvList('http://a, http://b')).toEqual(['http://a', 'http://b']);
  });

  it('splits semicolon-separated issuers', () => {
    expect(splitDelimitedEnvList('http://a;http://b')).toEqual(['http://a', 'http://b']);
  });

  it('returns empty array for undefined', () => {
    expect(splitDelimitedEnvList(undefined)).toEqual([]);
  });
});
