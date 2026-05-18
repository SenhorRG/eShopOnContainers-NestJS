import { describe, expect, it, vi } from 'vitest';

import {
  pruneProcessedIntegrationEvents,
  resolveProcessedEventsRetentionDays,
} from './prune-processed-integration-events';

describe('pruneProcessedIntegrationEvents', () => {
  it('uses default 90 days when env unset', () => {
    expect(resolveProcessedEventsRetentionDays(undefined)).toBe(90);
  });

  it('deletes rows older than retention window', async () => {
    const deleteMany = vi.fn().mockResolvedValue({ count: 3 });
    const prisma = { processedIntegrationEventRow: { deleteMany } };
    const count = await pruneProcessedIntegrationEvents(prisma, 7);
    expect(count).toBe(3);
    expect(deleteMany).toHaveBeenCalledWith({
      where: { processedAt: { lt: expect.any(Date) } },
    });
  });
});
