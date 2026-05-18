import { describe, expect, it } from 'vitest';

import { formatContextRoute } from './format-context-route';

describe('formatContextRoute', () => {
  it('joins route and context', () => {
    expect(formatContextRoute('trace abc', 'GET /api/health · → 200 · 53ms')).toBe(
      'GET /api/health · → 200 · 53ms · trace abc',
    );
  });

  it('returns em dash when both are empty', () => {
    expect(formatContextRoute('—', '—')).toBe('—');
  });
});
