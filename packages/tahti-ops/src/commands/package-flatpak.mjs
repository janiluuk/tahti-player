import { execFileSync, spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { renderTemplate, sha256OfUrl } from '../packaging.mjs';
import { OpsError, playerRoot } from '../paths.mjs';
import { runProgram, runSteps } from '../run-script.mjs';

const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const FLATPAK_DIR = 'packaging/flatpak';
const MANIFEST = 'live.tahti.player.yml';
const FLATHUB_REPO = 'flathub/live.tahti.player';
const CARGO_GENERATOR_URL =
  'https://raw.githubusercontent.com/flatpak/flatpak-builder-tools/refs/heads/master/cargo/flatpak-cargo-generator.py';
const NODE_GENERATOR_INSTALL =
  'pipx install git+https://github.com/flatpak/flatpak-builder-tools.git#subdirectory=node';

/** `pnpm@12.5.1+sha512.…` → `12.5.1`; the npm tarball name has no hash. */
export function pnpmVersion(packageManager) {
  const match = /^pnpm@([^+]+)/.exec(packageManager ?? '');
  if (!match) {
    throw new OpsError(`packageManager is not pnpm: ${packageManager}`);
  }
  return match[1];
}

function internalStep(label, action) {
  return async ({ dryRun }) => {
    if (dryRun) {
      return { exitCode: 0, output: `dry-run: ${label}` };
    }
    console.error(`→ ${label}`);
    const output = await action();
    console.error(`✓ ${label}`);
    return { exitCode: 0, output: output ?? '' };
  };
}

function onPath(program, env) {
  const found = spawnSync('/bin/sh', ['-c', `command -v ${program}`], {
    env,
    stdio: 'ignore',
  });
  return found.status === 0;
}

function checkGenerators(env) {
  if (!onPath('flatpak-node-generator', env)) {
    throw new OpsError(
      `flatpak-node-generator not found. Install it with: ${NODE_GENERATOR_INSTALL}`,
    );
  }
  if (!onPath('python3', env)) {
    throw new OpsError('python3 not found.');
  }
}

function sourcesSteps({ root, outDir, env, fetchImpl }) {
  const cargoGenerator = resolve(
    root,
    FLATPAK_DIR,
    '.flatpak-cargo-generator.py',
  );
  return [
    internalStep(
      'flatpak cargo generator (download when missing)',
      async () => {
        if (existsSync(cargoGenerator)) {
          return '';
        }
        const response = await fetchImpl(CARGO_GENERATOR_URL);
        if (!response.ok) {
          throw new OpsError(
            `Download failed (${response.status}): ${CARGO_GENERATOR_URL}`,
          );
        }
        writeFileSync(cargoGenerator, await response.text());
        return '';
      },
    ),
    ({ dryRun }) =>
      runProgram(
        'flatpak-node-generator',
        [
          'pnpm',
          '-o',
          join(outDir, 'pnpm-sources.json'),
          resolve(root, 'pnpm-lock.yaml'),
        ],
        { dryRun, env, cwd: root, label: 'flatpak pnpm-sources.json' },
      ),
    ({ dryRun }) =>
      runProgram(
        'python3',
        [
          cargoGenerator,
          resolve(root, 'packages/player/src-tauri/Cargo.lock'),
          '-o',
          join(outDir, 'cargo-sources.json'),
        ],
        { dryRun, env, cwd: root, label: 'flatpak cargo-sources.json' },
      ),
  ];
}

/** Writes pnpm-sources.json and cargo-sources.json (offline dependency
 * manifests for the from-source Flatpak build). */
export function runFlatpakSources({
  dryRun = false,
  outDir = null,
  root = playerRoot(),
  env = process.env,
  fetchImpl = fetch,
} = {}) {
  const out = outDir ? resolve(outDir) : resolve(root, FLATPAK_DIR);
  if (!dryRun) {
    checkGenerators(env);
  }
  return runSteps(sourcesSteps({ root, outDir: out, env, fetchImpl }), {
    dryRun,
  });
}

/** Opens a PR on flathub/live.tahti.player that points the manifest at the
 * player@<version> tag, with regenerated dependency sources. */
export function runFlathubUpdate(
  version,
  {
    dryRun = false,
    root = playerRoot(),
    env = process.env,
    fetchImpl = fetch,
  } = {},
) {
  if (!version) {
    throw new OpsError(
      'Missing version (e.g. tahti-ops package flatpak flathub 1.48.0)',
    );
  }
  if (!VERSION_PATTERN.test(version)) {
    throw new OpsError(`Not a semver version: ${version}`);
  }
  if (!dryRun) {
    if (!env.GH_TOKEN) {
      throw new OpsError('GH_TOKEN must be set (Flathub repo write access)');
    }
    checkGenerators(env);
  }

  const tag = `player@${version}`;
  const branch = `flathub/v${version}`;
  const packageJson = JSON.parse(
    readFileSync(resolve(root, 'package.json'), 'utf8'),
  );
  const pnpm = pnpmVersion(packageJson.packageManager);
  const pnpmUrl = `https://registry.npmjs.org/pnpm/-/pnpm-${pnpm}.tgz`;
  const workDir = dryRun
    ? join(tmpdir(), 'tahti-flathub-XXXXXX')
    : mkdtempSync(join(tmpdir(), 'tahti-flathub-'));
  const vars = { TAG: tag, PNPM_VERSION: pnpm };
  const inWork = (args, label) => (opts) =>
    runProgram('git', ['-C', workDir, ...args], {
      dryRun: opts.dryRun,
      env,
      label,
    });

  const steps = [
    internalStep(`flathub resolve ${tag} to a commit`, () => {
      vars.COMMIT = execFileSync('git', ['rev-list', '-n1', tag], {
        cwd: root,
        encoding: 'utf8',
      }).trim();
      return `${tag} = ${vars.COMMIT}`;
    }),
    internalStep(`flathub sha256 of ${pnpmUrl}`, async () => {
      vars.PNPM_SHA256 = await sha256OfUrl(pnpmUrl, fetchImpl);
      return `pnpm ${pnpm} sha256: ${vars.PNPM_SHA256}`;
    }),
    internalStep(`flathub clone ${FLATHUB_REPO} into ${workDir}`, async () => {
      const cloned = await runProgram(
        'git',
        [
          'clone',
          `https://x-access-token:${env.GH_TOKEN}@github.com/${FLATHUB_REPO}.git`,
          workDir,
        ],
        { env, label: `git clone ${FLATHUB_REPO}` },
      );
      if (cloned.exitCode !== 0) {
        throw new OpsError(`git clone ${FLATHUB_REPO} failed`);
      }
    }),
    inWork(['checkout', '-b', branch], `flathub branch ${branch}`),
    ...sourcesSteps({ root, outDir: workDir, env, fetchImpl }),
    internalStep(`flathub render ${MANIFEST}`, () => {
      const template = readFileSync(
        resolve(root, FLATPAK_DIR, `${MANIFEST}.template`),
        'utf8',
      );
      writeFileSync(join(workDir, MANIFEST), renderTemplate(template, vars));
    }),
    inWork(['config', 'user.name', 'Tahti'], 'flathub git user'),
    inWork(['config', 'user.email', 'noreply@tahti.live'], 'flathub git email'),
    inWork(['add', '-A'], 'flathub stage'),
    inWork(
      ['commit', '-m', `Update to ${version}`],
      `flathub commit "Update to ${version}"`,
    ),
    inWork(['push', 'origin', branch], `flathub push ${branch}`),
    ({ dryRun: dry }) =>
      runProgram(
        'gh',
        [
          'pr',
          'create',
          '--repo',
          FLATHUB_REPO,
          '--head',
          branch,
          '--base',
          'master',
          '--title',
          `Update to ${version}`,
          '--body',
          `Automated update to ${tag}.`,
        ],
        { dryRun: dry, env, label: `flathub PR on ${FLATHUB_REPO}` },
      ),
  ];

  return runSteps(steps, { dryRun }).finally(() => {
    if (!dryRun) {
      rmSync(workDir, { recursive: true, force: true });
    }
  });
}
