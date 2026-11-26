#!/usr/bin/env node
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { reportUnusedWebKeys } from './unusedWebKeys.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const unused = reportUnusedWebKeys(repoRoot);

if (unused.length === 0) {
  console.log('i18n: every web.* key is referenced in packages/*/src.');
} else {
  console.log(
    `i18n: ${unused.length} web.* key(s) have no reference in packages/*/src:`,
  );
  for (const key of unused) {
    console.log(`  web.${key}`);
  }
  console.log(
    '\nRemove them from en_US.json and fi_FI.json, or add a dynamic prefix to DYNAMIC_KEY_ALLOWLIST in packages/i18n/scripts/unusedWebKeys.mjs.',
  );
}

if (process.argv.includes('--strict') && unused.length > 0) {
  process.exitCode = 1;
}
