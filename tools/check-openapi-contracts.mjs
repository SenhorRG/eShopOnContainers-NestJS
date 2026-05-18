import { existsSync } from 'node:fs';

import {
  LIVE_EXPORTS,
  SNAPSHOT_FILES,
  readSnapshot,
  resolveLiveUrl,
  snapshotPath,
  stableJson,
} from './lib/openapi-snapshots.mjs';

function validateSnapshotFile(file) {
  const path = snapshotPath(file);
  if (!existsSync(path)) {
    throw new Error(`Missing snapshot: ${path}`);
  }
  const doc = readSnapshot(file);
  if (typeof doc.openapi !== 'string' || !doc.openapi.startsWith('3.')) {
    throw new Error(`${file}: expected OpenAPI 3.x document`);
  }
  if (!doc.paths || typeof doc.paths !== 'object') {
    throw new Error(`${file}: missing paths object`);
  }
  return doc;
}

async function fetchLiveJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) {
    throw new Error(`GET ${url} -> ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function checkLiveDrift() {
  let failed = false;
  for (const entry of LIVE_EXPORTS) {
    const url = resolveLiveUrl(entry);
    const snapshot = readSnapshot(entry.file);
    try {
      const live = await fetchLiveJson(url);
      if (stableJson(snapshot) !== stableJson(live)) {
        console.error(
          `[contracts] drift: ${entry.file} differs from live ${url}\n` +
            '  Run `pnpm contracts:export-openapi` with services up, then commit snapshots.',
        );
        failed = true;
      } else {
        console.log(`[contracts] live OK: ${entry.file}`);
      }
    } catch (error) {
      console.error(`[contracts] live check failed for ${entry.file} (${url}):`, error.message);
      failed = true;
    }
  }
  if (failed) {
    process.exit(1);
  }
}

async function main() {
  for (const file of SNAPSHOT_FILES) {
    validateSnapshotFile(file);
    console.log(`[contracts] snapshot OK: ${file}`);
  }

  if (process.env.CHECK_OPENAPI_LIVE === '1') {
    await checkLiveDrift();
  }
}

main().catch((error) => {
  console.error('[contracts] check failed:', error.message);
  process.exit(1);
});
