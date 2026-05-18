import { describe, expect, it } from 'vitest';

import { checkSameOrigin } from './grant-url-tester.service';

describe('checkSameOrigin', () => {
  it('accepts matching scheme host port', () => {
    expect(
      checkSameOrigin('https://ex.com:444/a/hook', 'https://ex.com:444/grant'),
    ).toBe(true);
  });

  it('rejects different hosts', () => {
    expect(checkSameOrigin('https://a.com/x', 'https://b.com/y')).toBe(false);
  });
});
