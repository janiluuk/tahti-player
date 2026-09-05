/**
 * Shared Vitest CI reporters: junit + snapshot digest collector.
 * Usage from packages/<name>/vite.config.ts:
 *   import { vitestCiReporters } from '../../scripts/ci/vitest-ci-reporters.mjs';
 *   reporters: vitestCiReporters(import.meta.url),
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function vitestCiReporters(importerMetaUrl) {
  const reporters = ['default'];
  if (!process.env.CI) {
    return reporters;
  }

  reporters.push('junit');

  const fromPackage = path.dirname(fileURLToPath(importerMetaUrl));
  const reporterPath = path.resolve(
    fromPackage,
    '../../scripts/ci/vitest-snapshot-reporter.mjs',
  );
  reporters.push(reporterPath);
  return reporters;
}
