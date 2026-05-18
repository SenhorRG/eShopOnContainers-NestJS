import { spawnSync } from 'node:child_process';

import { SNAPSHOT_FILES, snapshotPath } from './lib/openapi-snapshots.mjs';

function oasdiffAvailable() {
  const probe = spawnSync('oasdiff', ['--version'], {
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  return probe.status === 0;
}

function main() {
  if (!oasdiffAvailable()) {
    console.log('[contracts] oasdiff CLI not found; skipping optional breaking-change check.');
    process.exit(0);
  }

  let failed = false;
  for (const file of SNAPSHOT_FILES) {
    const path = snapshotPath(file);
    const result = spawnSync('oasdiff', ['breaking', path, path], {
      encoding: 'utf8',
      shell: process.platform === 'win32',
    });
    if (result.status !== 0) {
      console.error(`[contracts] oasdiff could not validate ${file}:`);
      console.error(result.stderr || result.stdout);
      failed = true;
    } else {
      console.log(`[contracts] oasdiff OK: ${file}`);
    }
  }

  process.exit(failed ? 1 : 0);
}

main();
