import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { main } from './cli.mjs';
import { runReleasePrepare } from './commands/release.mjs';

describe('release prepare', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  const output = () =>
    logSpy.mock.calls.map((call) => String(call[0])).join('\n');

  it('is listed in help', async () => {
    await main(['--help']);
    expect(output()).toContain('tahti-ops release prepare <version>');
  });

  it('shows command help', async () => {
    expect(await main(['release', 'prepare', '--help'])).toBe(0);
    expect(output()).toContain('--build');
    expect(output()).toContain('pnpm release:prepare');
  });

  it('dry-runs the version bump and prints the push command', async () => {
    expect(await main(['release', 'prepare', '99.0.0', '--dry-run'])).toBe(0);
    expect(output()).toBe(
      [
        'dry-run: release player@99.0.0 (bump, metainfo, commit, tag) — node packages/tools/src/prepare-release.mjs 99.0.0',
        'Next: git push origin player@99.0.0',
      ].join('\n'),
    );
  });

  it('adds the Tauri bundle with --build', async () => {
    await main(['release', 'prepare', '99.0.0', '--build', '--dry-run']);
    expect(output()).toContain(
      'dry-run: desktop bundle — pnpm --filter @tahti-player/player tauri build',
    );
  });

  it('rejects a missing or malformed version', async () => {
    await expect(main(['release', 'prepare', '--dry-run'])).rejects.toThrow(
      /Missing version/,
    );
    await expect(
      main(['release', 'prepare', 'v1.2', '--dry-run']),
    ).rejects.toThrow(/Not a semver version: v1.2/);
  });

  it('rejects unknown options', async () => {
    await expect(
      main(['release', 'prepare', '99.0.0', '--push', '--dry-run']),
    ).rejects.toThrow(/Unknown option: --push/);
  });

  it('refuses a version whose tag already exists', async () => {
    const root = mkdtempSync(join(tmpdir(), 'tahti-ops-release-'));
    const git = (...args: string[]) =>
      execFileSync('git', args, { cwd: root, stdio: 'ignore' });
    git('init', '-q');
    git(
      '-c',
      'user.name=t',
      '-c',
      'user.email=t@example.invalid',
      'commit',
      '-q',
      '--allow-empty',
      '-m',
      'init',
    );
    git('tag', 'player@1.0.0');

    await expect(
      runReleasePrepare('1.0.0', { dryRun: true, root }),
    ).rejects.toThrow(/Tag player@1.0.0 already exists/);
  });
});
