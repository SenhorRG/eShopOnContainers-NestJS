import { describe, expect, it } from 'vitest';

import { runWithConcurrency } from './run-with-concurrency';

describe('runWithConcurrency', () => {
  it('runs all items with bounded parallelism', async () => {
    const seen: number[] = [];
    let active = 0;
    let maxActive = 0;

    await runWithConcurrency([1, 2, 3, 4, 5], 2, async (n) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((r) => setTimeout(r, 5));
      seen.push(n);
      active -= 1;
    });

    expect(seen.sort()).toEqual([1, 2, 3, 4, 5]);
    expect(maxActive).toBeLessThanOrEqual(2);
  });
});
