import { execFileSync } from 'node:child_process';

import { OpsError, playerRoot } from '../paths.mjs';
import { runProgram, runSteps } from '../run-script.mjs';

const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

function tagExists(tag, root) {
  try {
    execFileSync('git', ['rev-parse', '-q', '--verify', `refs/tags/${tag}`], {
      cwd: root,
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

/** Bumps the desktop version, updates the metainfo, commits and tags
 * `player@<version>`; with `build`, also builds the Tauri bundle. */
export async function runReleasePrepare(
  version,
  { dryRun = false, build = false, root = playerRoot() } = {},
) {
  if (!version) {
    throw new OpsError(
      'Missing version (e.g. tahti-ops release prepare 1.48.0)',
    );
  }
  if (!VERSION_PATTERN.test(version)) {
    throw new OpsError(`Not a semver version: ${version}`);
  }
  const tag = `player@${version}`;
  if (tagExists(tag, root)) {
    throw new OpsError(`Tag ${tag} already exists`);
  }

  const steps = [
    ({ dryRun: dry }) =>
      runProgram('node', ['packages/tools/src/prepare-release.mjs', version], {
        dryRun: dry,
        cwd: root,
        label: `release ${tag} (bump, metainfo, commit, tag)`,
      }),
  ];
  if (build) {
    steps.push(({ dryRun: dry }) =>
      runProgram(
        'pnpm',
        ['--filter', '@tahti-player/player', 'tauri', 'build'],
        {
          dryRun: dry,
          cwd: root,
          label: 'desktop bundle',
        },
      ),
    );
  }

  const result = await runSteps(steps, { dryRun });
  if (result.exitCode !== 0) {
    return result;
  }
  const next = `Next: git push origin ${tag}`;
  return {
    exitCode: 0,
    output: result.output ? `${result.output}\n${next}` : next,
  };
}
