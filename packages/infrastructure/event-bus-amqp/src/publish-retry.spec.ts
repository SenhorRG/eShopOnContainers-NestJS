import { describe, expect, it, vi } from 'vitest';

import { withPublishRetry } from './publish-retry';

describe('withPublishRetry', () => {
  it('eventually succeeds after transient faults', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error('ECONNRESET'), { code: 'ECONNRESET' }))
      .mockResolvedValueOnce(undefined);

    await expect(withPublishRetry(3, fn)).resolves.toBeUndefined();
    expect(fn.mock.calls.length).toBe(2);
  });

  it('stops retrying once attempts exhaust', async () => {
    const err = Object.assign(new Error('ECONNRESET'), { code: 'ECONNRESET' });
    const fn = vi.fn().mockRejectedValue(err);

    await expect(withPublishRetry(1, fn)).rejects.toBe(err);
    expect(fn.mock.calls.length).toBe(2); // attempt 0 + retry 1
  });
});
