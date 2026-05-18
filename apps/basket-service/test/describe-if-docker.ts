import { execSync } from 'node:child_process';
import { describe } from 'vitest';

/** Testcontainers/Ryuk requires a Docker API reachable from Node (local Docker Desktop, Colima, etc.). */
export function dockerDaemonReachable(): boolean {
  try {
    execSync('docker info', { stdio: 'ignore', timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

export const describeIfDocker = describe.skipIf(!dockerDaemonReachable());
