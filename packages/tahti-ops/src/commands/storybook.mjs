import { relative, resolve } from 'node:path';

import { OpsError, playerRoot } from '../paths.mjs';
import { runProgram } from '../run-script.mjs';

const SCRIPT = 'scripts/generate-storybook-surfaces.mjs';

/** Regenerate or validate STORYBOOK-SURFACES.md from Storybook meta titles. */
export function runStorybookSurfaces(argv, { dryRun = false } = {}) {
  const root = playerRoot();
  const allowed = new Set(['--check', '--report', '--stage']);
  for (const arg of argv) {
    if (!allowed.has(arg)) {
      throw new OpsError(`Unknown option for storybook surfaces: ${arg}`);
    }
  }
  const label = `storybook surfaces${argv.length ? ` ${argv.join(' ')}` : ''}`;
  return runProgram('node', [SCRIPT, ...argv], {
    dryRun,
    cwd: root,
    label,
  });
}

export function storybookSurfacesScriptPath() {
  return relative(playerRoot(), resolve(playerRoot(), SCRIPT));
}
