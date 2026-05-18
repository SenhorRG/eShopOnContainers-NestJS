import { execSync } from 'node:child_process';

import { describe, type SuiteAPI } from 'vitest';

export function dockerDaemonReachable(): boolean {
  try {
    execSync('docker info', { stdio: 'ignore', timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

export const describeIfDocker = describe.skipIf(!dockerDaemonReachable()) as SuiteAPI;
