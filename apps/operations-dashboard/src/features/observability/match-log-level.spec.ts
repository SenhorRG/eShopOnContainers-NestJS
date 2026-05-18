import { describe, expect, it } from 'vitest';

import { matchesLogLevelFilter } from './match-log-level';

describe('matchesLogLevelFilter', () => {
  it('matches pino numeric and otlp severity levels', () => {
    expect(matchesLogLevelFilter('error', 'error')).toBe(true);
    expect(matchesLogLevelFilter('50', 'error')).toBe(true);
    expect(matchesLogLevelFilter('info', 'info')).toBe(true);
    expect(matchesLogLevelFilter('30', 'info')).toBe(true);
    expect(matchesLogLevelFilter('info', 'error')).toBe(false);
  });
});
