import { describe, expect, test } from 'vitest';

import { ORDERING_OUTBOX_PENDING_BY_TRANSACTION_SQL } from '../src/integration/ordering-outbox-publish-queries';

describe('Ordering outbox publish query', () => {
  test('orders pending rows by CreationTime ascending (transactional FIFO)', () => {
    expect(ORDERING_OUTBOX_PENDING_BY_TRANSACTION_SQL).toMatch(/ORDER BY "CreationTime" ASC/);
  });
});
