import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

import {
  LIVE_EXPORTS,
  SNAPSHOT_DIR,
  resolveLiveUrl,
  snapshotPath,
  stableJson,
} from './lib/openapi-snapshots.mjs';

async function exportLive(entry) {
  const url = resolveLiveUrl(entry);
  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) {
    throw new Error(`GET ${url} -> ${response.status} ${response.statusText}`);
  }
  const document = await response.json();
  const out = snapshotPath(entry.file);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, stableJson(document), 'utf8');
  console.log(`[contracts] exported ${entry.file} from ${url}`);
}

async function main() {
  mkdirSync(SNAPSHOT_DIR, { recursive: true });
  let failed = false;
  for (const entry of LIVE_EXPORTS) {
    try {
      await exportLive(entry);
    } catch (error) {
      console.error(`[contracts] export failed for ${entry.file}:`, error.message);
      failed = true;
    }
  }
  console.log(
    '[contracts] mobile-bff.openapi.json is static (see apps/mobile-bff); not exported from live Swagger.',
  );
  if (failed) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('[contracts] export failed:', error.message);
  process.exit(1);
});
