import { createHash } from 'node:crypto';
import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { OpsError, playerRoot } from '../paths.mjs';
import { runProgram, runSteps } from '../run-script.mjs';

const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const TEMPLATE = 'packaging/aur/tahti-player-bin/PKGBUILD.template';
const AUR_REMOTE = 'ssh://aur@aur.archlinux.org/tahti-player-bin.git';

export function debUrl(version) {
  return `https://github.com/janiluuk/tahti-player/releases/download/player@${version}/Tahti_${version}_amd64.deb`;
}

/** Like `envsubst '$A $B'`: only the named `${VAR}`s are replaced, so
 * PKGBUILD variables such as `${pkgver}` and `${srcdir}` stay as they are. */
export function renderTemplate(template, vars) {
  return template.replace(/\$\{([A-Z0-9_]+)\}/g, (match, name) =>
    Object.hasOwn(vars, name) ? vars[name] : match,
  );
}

export async function sha256OfUrl(url, fetchImpl = fetch) {
  const response = await fetchImpl(url);
  if (!response.ok) {
    throw new OpsError(`Download failed (${response.status}): ${url}`);
  }
  const hash = createHash('sha256');
  for await (const chunk of response.body) {
    hash.update(chunk);
  }
  return hash.digest('hex');
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

function srcinfoCommand(workDir, isRoot) {
  const generate = `cd '${workDir}' && makepkg --printsrcinfo > .SRCINFO`;
  if (!isRoot) {
    return generate;
  }
  // makepkg refuses to run as root, and the CI job runs in an archlinux
  // container as root.
  return [
    'useradd -m builduser 2>/dev/null || true',
    `chown -R builduser '${workDir}'`,
    `su builduser -c "${generate}"`,
  ].join(' && ');
}

/** Renders the tahti-player-bin PKGBUILD + .SRCINFO for a released version
 * and pushes them to the AUR (or prints them with `push: false`). */
export function runPackageAur(
  version,
  {
    dryRun = false,
    push = true,
    root = playerRoot(),
    workDir = join(tmpdir(), 'tahti-aur-bin'),
    repoDir = join(tmpdir(), 'tahti-aur-repo'),
    isRoot = process.getuid?.() === 0,
    fetchImpl = fetch,
  } = {},
) {
  if (!version) {
    throw new OpsError('Missing version (e.g. tahti-ops package aur 1.48.0)');
  }
  if (!VERSION_PATTERN.test(version)) {
    throw new OpsError(`Not a semver version: ${version}`);
  }
  const url = debUrl(version);
  let sha256 = null;

  const steps = [
    internalStep(`aur sha256 of ${url}`, async () => {
      sha256 = await sha256OfUrl(url, fetchImpl);
      return `sha256: ${sha256}`;
    }),
    internalStep(`aur render PKGBUILD into ${workDir}`, () => {
      rmSync(workDir, { recursive: true, force: true });
      mkdirSync(workDir, { recursive: true });
      const template = readFileSync(resolve(root, TEMPLATE), 'utf8');
      writeFileSync(
        join(workDir, 'PKGBUILD'),
        renderTemplate(template, { PKGVER: version, SHA256SUM: sha256 }),
      );
    }),
    ({ dryRun: dry }) =>
      runProgram('bash', ['-c', srcinfoCommand(workDir, isRoot)], {
        dryRun: dry,
        label: 'aur .SRCINFO (makepkg --printsrcinfo)',
      }),
  ];

  if (!push) {
    steps.push(
      internalStep('aur print PKGBUILD and .SRCINFO', () =>
        [
          readFileSync(join(workDir, 'PKGBUILD'), 'utf8'),
          '---',
          readFileSync(join(workDir, '.SRCINFO'), 'utf8'),
        ].join('\n'),
      ),
    );
    return runSteps(steps, { dryRun });
  }

  steps.push(
    internalStep(`aur clone ${AUR_REMOTE}`, async () => {
      rmSync(repoDir, { recursive: true, force: true });
      await mustRun('git', ['clone', AUR_REMOTE, repoDir]);
      for (const file of ['PKGBUILD', '.SRCINFO']) {
        copyFileSync(join(workDir, file), join(repoDir, file));
      }
    }),
    internalStep(
      `aur commit "Update to ${version}" and push (skipped when unchanged)`,
      async () => {
        await mustRun('git', ['add', 'PKGBUILD', '.SRCINFO'], repoDir);
        const unchanged = await runProgram(
          'git',
          ['diff', '--cached', '--quiet'],
          { cwd: repoDir, log: () => {} },
        );
        if (unchanged.exitCode === 0) {
          return 'Already up to date.';
        }
        await mustRun(
          'git',
          [
            '-c',
            'user.name=Tahti',
            '-c',
            'user.email=noreply@tahti.live',
            'commit',
            '-m',
            `Update to ${version}`,
          ],
          repoDir,
        );
        await mustRun('git', ['push', 'origin', 'master'], repoDir);
        return `Pushed tahti-player-bin ${version} to the AUR.`;
      },
    ),
  );
  return runSteps(steps, { dryRun });
}

async function mustRun(program, args, cwd = process.cwd()) {
  const result = await runProgram(program, args, { cwd });
  if (result.exitCode !== 0) {
    throw new OpsError(
      `${program} ${args[0]} failed (exit ${result.exitCode})`,
    );
  }
}
