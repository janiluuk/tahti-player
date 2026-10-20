import { resolve } from 'node:path';

import { OpsError, playerRoot } from '../paths.mjs';
import { runProgram, runScript } from '../run-script.mjs';

const MODES = {
  run: 'Build the desktop app (release, no installer) and launch it',
  launch: 'Launch the last desktop build without rebuilding (Linux)',
  dev: 'Run the desktop app in dev mode with hot reload',
  bundle: 'Build installers / packages (pnpm tauri build)',
};

export function desktopModes() {
  return MODES;
}

export function runDesktop(mode, { dryRun = false, extraArgs = [] } = {}) {
  const root = playerRoot();
  switch (mode) {
    case 'run':
      return runScript(
        resolve(root, 'scripts/build-and-run-player.sh'),
        extraArgs,
        { dryRun, label: 'desktop build + launch' },
      );
    case 'launch':
      return runScript(resolve(root, 'scripts/run-linux.sh'), extraArgs, {
        dryRun,
        label: 'desktop launch',
      });
    case 'dev':
      return runProgram('pnpm', ['dev', ...extraArgs], {
        dryRun,
        cwd: root,
        label: 'desktop dev',
      });
    case 'bundle':
      return runProgram('pnpm', ['tauri', 'build', ...extraArgs], {
        dryRun,
        cwd: root,
        label: 'desktop bundle',
      });
    default:
      throw new OpsError(
        `Unknown desktop mode: ${mode ?? '(none)'} (try: ${Object.keys(MODES).join(', ')})`,
      );
  }
}
