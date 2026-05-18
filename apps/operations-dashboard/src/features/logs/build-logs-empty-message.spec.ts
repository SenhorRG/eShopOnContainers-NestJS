import { describe, expect, it } from 'vitest';

import { buildLogsEmptyMessage } from './build-logs-empty-message';

describe('buildLogsEmptyMessage', () => {
  it('returns loading text while fetching', () => {
    expect(buildLogsEmptyMessage(true)).toBe('Loading logs...');
  });

  it('returns a single empty-state message', () => {
    expect(buildLogsEmptyMessage(false)).toBe('No logs to show for the current filters');
  });
});
