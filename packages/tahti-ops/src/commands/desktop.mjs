import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { OpsError, playerRoot } from '../paths.mjs';
import { runProgram, runScript, runSteps } from '../run-script.mjs';

const MODES = {
  run: 'Build the desktop app (release, no installer) and launch it',
  launch: 'Launch the last desktop build without rebuilding (Linux)',
  dev: 'Run the desktop app in dev mode with hot reload',
  bundle: 'Build installers / packages (pnpm tauri build)',
  android:
    'Build and run a debug build on an Android device/emulator (needs JDK 17+, ANDROID_HOME)',
};

const ANDROID_GEN_DIR = 'packages/player/src-tauri/gen/android';

function checkAndroidToolchain(env) {
  const java = spawnSync('java', ['-version'], { env, stdio: 'ignore' });
  if (java.error || java.status !== 0) {
    throw new OpsError(
      'Java (JDK 17+) is required. Install it and set JAVA_HOME.',
    );
  }
  if (!env.ANDROID_HOME && !env.ANDROID_SDK_ROOT) {
    throw new OpsError(
      'ANDROID_HOME (or ANDROID_SDK_ROOT) must point at an installed Android SDK.',
    );
  }
}

function runAndroid({ dryRun, extraArgs, env, root }) {
  if (!dryRun) {
    checkAndroidToolchain(env);
  }
  const tauri = ['--filter', '@tahti-player/player', 'tauri', 'android'];
  const steps = [];
  if (!existsSync(resolve(root, ANDROID_GEN_DIR))) {
    steps.push(({ dryRun: dry }) =>
      runProgram('pnpm', [...tauri, 'init'], {
        dryRun: dry,
        env,
        cwd: root,
        label: 'android init',
      }),
    );
  }
  steps.push(({ dryRun: dry }) =>
    runProgram('pnpm', [...tauri, 'run', '--debug', ...extraArgs], {
      dryRun: dry,
      env,
      cwd: root,
      label: 'android run (debug)',
    }),
  );
  return runSteps(steps, { dryRun });
}

export function desktopModes() {
  return MODES;
}

export function runDesktop(
  mode,
  {
    dryRun = false,
    extraArgs = [],
    env = process.env,
    root = playerRoot(),
  } = {},
) {
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
    case 'android':
      return runAndroid({ dryRun, extraArgs, env, root });
    default:
      throw new OpsError(
        `Unknown desktop mode: ${mode ?? '(none)'} (try: ${Object.keys(MODES).join(', ')})`,
      );
  }
}
