import { describe, expect, it } from 'vitest';

import { toLokiNanoseconds } from './time-range';

describe('toLokiNanoseconds', () => {
  it('returns an integer string without scientific notation', () => {
    const value = toLokiNanoseconds(1_778_955_455_612);
    expect(value).toMatch(/^\d+$/);
    expect(value).not.toContain('e');
    expect(value.endsWith('000000')).toBe(true);
  });
});
