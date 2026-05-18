import type { LogLevelFilter } from './build-logql';

export function matchesLogLevelFilter(parsedLevel: string, filter: LogLevelFilter): boolean {
  if (filter === 'all') {
    return true;
  }

  const level = parsedLevel.toLowerCase();

  if (filter === 'error') {
    return level === 'error' || level === 'fatal' || level === '50' || level === '60';
  }
  if (filter === 'warn') {
    return level === 'warn' || level === '40';
  }
  if (filter === 'info') {
    return level === 'info' || level === '30';
  }
  if (filter === 'debug') {
    return level === 'debug' || level === 'trace' || level === '10' || level === '20';
  }

  return true;
}
