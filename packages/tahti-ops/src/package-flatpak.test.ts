import { chmodSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { main } from './cli.mjs';
import {
  pnpmVersion,
  runFlathubUpdate,
  runFlatpakSources,
} from './commands/package-flatpak.mjs';

function binDir(programs: string[]) {
  const bin = mkdtempSync(join(tmpdir(), 'tahti-ops-bin-'));
  for (const program of programs) {
    writeFileSync(join(bin, program), '#!/bin/sh\nexit 0\n');
    chmodSync(join(bin, program), 0o755);
  }
  return bin;
}

describe('package flatpak', () => {
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
    expect(output()).toContain('tahti-ops package flatpak');
    logSpy.mockClear();
    expect(await main(['package', 'flatpak', '--help'])).toBe(0);
    expect(output()).toContain('flathub <version>');
  });

  it('dry-runs source generation into a chosen directory', async () => {
    const out = mkdtempSync(join(tmpdir(), 'tahti-ops-flatpak-'));
    expect(
      await main(['package', 'flatpak', 'sources', '--out', out, '--dry-run']),
    ).toBe(0);
    expect(output()).toContain(
      `flatpak-node-generator pnpm -o ${join(out, 'pnpm-sources.json')}`,
    );
    expect(output()).toContain(`-o ${join(out, 'cargo-sources.json')}`);
  });

  it('dry-runs the Flathub update from tag to PR', async () => {
    await main(['package', 'flatpak', 'flathub', '1.47.112', '--dry-run']);
    const lines = output().split('\n');
    expect(lines[0]).toBe(
      'dry-run: flathub resolve player@1.47.112 to a commit',
    );
    expect(lines[1]).toMatch(
      /^dry-run: flathub sha256 of https:\/\/registry\.npmjs\.org\/pnpm\/-\/pnpm-\d+\.\d+\.\d+\.tgz$/,
    );
    expect(lines.at(-1)).toBe(
      'dry-run: flathub PR on flathub/live.tahti.player — gh pr create --repo flathub/live.tahti.player --head flathub/v1.47.112 --base master --title "Update to 1.47.112" --body "Automated update to player@1.47.112."',
    );
  });

  it('strips the integrity hash from packageManager', () => {
    expect(pnpmVersion('pnpm@12.5.1+sha512.abc')).toBe('12.5.1');
    expect(pnpmVersion('pnpm@10.33.4')).toBe('10.33.4');
    expect(() => pnpmVersion('yarn@4.0.0')).toThrow(/not pnpm/);
  });

  it('needs GH_TOKEN before touching Flathub', () => {
    expect(() =>
      runFlathubUpdate('1.47.112', { env: { PATH: binDir([]) } }),
    ).toThrow(/GH_TOKEN must be set/);
  });

  it('needs the source generators', () => {
    expect(() => runFlatpakSources({ env: { PATH: binDir([]) } })).toThrow(
      /flatpak-node-generator not found/,
    );
    expect(() =>
      runFlatpakSources({ env: { PATH: binDir(['flatpak-node-generator']) } }),
    ).toThrow(/python3 not found/);
  });

  it('rejects bad versions, actions and options', async () => {
    await expect(
      main(['package', 'flatpak', 'flathub', '--dry-run']),
    ).rejects.toThrow(/Missing version/);
    await expect(
      main(['package', 'flatpak', 'flathub', 'v1', '--dry-run']),
    ).rejects.toThrow(/Not a semver version/);
    await expect(main(['package', 'flatpak', 'build'])).rejects.toThrow(
      /Try: tahti-ops package flatpak/,
    );
    await expect(
      main(['package', 'flatpak', 'sources', '--force']),
    ).rejects.toThrow(/Unknown option: --force/);
  });
});
