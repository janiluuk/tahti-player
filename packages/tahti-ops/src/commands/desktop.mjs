import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { OpsError, playerRoot } from '../paths.mjs';
import { runProgram, runScript, runSteps } from '../run-script.mjs';

const MODES = {
  run: 'Build the desktop app (release, no installer) and launch it',
  latest:
    'Build origin/master (or --ref <branch>) in its own worktree (.desktop-build) and launch it (--no-launch to only build, --clean to remove the worktree); leaves this checkout alone',
  launch: 'Launch the last desktop build without rebuilding (Linux)',
  dev: 'Run the desktop app in dev mode with hot reload',
  bundle: 'Build installers / packages (pnpm tauri build)',
  android:
    'Build and run a debug build on an Android device/emulator (needs JDK 17+, ANDROID_HOME)',
};

const ANDROID_GEN_DIR = 'packages/player/src-tauri/gen/android';
const LATEST_DIR = '.desktop-build';
const NO_BUNDLE_CONFIG =
  '{"build":{"beforeBuildCommand":""},"bundle":{"active":false,"createUpdaterArtifacts":false}}';

export function parseLatestArgs(args) {
  const rest = [];
  let ref = 'master';
  let launch = true;
  let clean = false;
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--ref') {
      const value = args[i + 1];
      if (!value || value.startsWith('--')) {
        throw new OpsError('--ref needs a branch name');
      }
      ref = value;
      i += 1;
    } else if (arg.startsWith('--ref=')) {
      ref = arg.slice('--ref='.length);
    } else if (arg === '--no-launch') {
      launch = false;
    } else if (arg === '--clean') {
      clean = true;
    } else {
      rest.push(arg);
    }
  }
  if (!/^[\w./-]+$/.test(ref)) {
    throw new OpsError(`Not a branch name: ${ref}`);
  }
  return { ref, launch, clean, rest };
}

function runLatest({ dryRun, extraArgs, env, root }) {
  const { ref, launch, clean, rest } = parseLatestArgs(extraArgs);
  const worktree = resolve(root, LATEST_DIR);
  if (!dryRun) {
    const cargo = spawnSync('cargo', ['--version'], { env, stdio: 'ignore' });
    if (cargo.error || cargo.status !== 0) {
      throw new OpsError(
        'Rust (cargo) is needed to build the desktop app: https://rustup.rs, plus the Tauri 2 system packages.',
      );
    }
  }
  if (clean) {
    return runSteps(
      [
        ({ dryRun: dry }) =>
          runProgram('git', ['worktree', 'remove', '--force', worktree], {
            dryRun: dry,
            env,
            cwd: root,
            label: `remove ${LATEST_DIR}`,
          }),
      ],
      { dryRun },
    );
  }
  const targetDir =
    env.CARGO_TARGET_DIR ?? resolve(root, 'packages/player/src-tauri/target');
  const buildEnv = { ...env, CARGO_TARGET_DIR: targetDir };
  const player = ['--filter', '@tahti-player/player', '--fail-if-no-match'];
  const step =
    (program, args, label, cwd = worktree, stepEnv = buildEnv) =>
    ({ dryRun: dry }) =>
      runProgram(program, args, { dryRun: dry, env: stepEnv, cwd, label });
  return runSteps(
    [
      step('git', ['fetch', 'origin', ref], `fetch origin/${ref}`, root, env),
      existsSync(worktree)
        ? step(
            'git',
            ['checkout', '--force', '--detach', `origin/${ref}`],
            `check out origin/${ref} in ${LATEST_DIR}`,
          )
        : step(
            'git',
            ['worktree', 'add', '--detach', worktree, `origin/${ref}`],
            `create ${LATEST_DIR} at origin/${ref}`,
            root,
            env,
          ),
      step('pnpm', ['install', '--frozen-lockfile'], 'install dependencies'),
      step('pnpm', [...player, 'build:frontend'], 'build frontend'),
      step(
        'pnpm',
        [...player, 'tauri', 'build', '--no-bundle', '-c', NO_BUNDLE_CONFIG],
        'compile desktop app (release)',
      ),
      ...(launch
        ? [
            step(
              resolve(targetDir, 'release/tahti-player'),
              rest,
              'launch desktop app',
            ),
          ]
        : [
            () => ({
              exitCode: 0,
              output: `Built ${resolve(targetDir, 'release/tahti-player')}`,
            }),
          ]),
    ],
    { dryRun },
  );
}

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
    case 'latest':
      return runLatest({ dryRun, extraArgs, env, root });
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
