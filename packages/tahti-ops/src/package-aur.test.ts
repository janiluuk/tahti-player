import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { main } from './cli.mjs';
import { debUrl, runPackageAur } from './commands/package-aur.mjs';
import { renderTemplate, sha256OfUrl } from './packaging.mjs';
import { playerRoot } from './paths.mjs';

describe('package aur', () => {
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
    expect(output()).toContain('tahti-ops package aur <version>');
    logSpy.mockClear();
    expect(await main(['package', 'aur', '--help'])).toBe(0);
    expect(output()).toContain('--no-push');
  });

  it('dry-runs the publish without network or git', async () => {
    expect(await main(['package', 'aur', '1.47.112', '--dry-run'])).toBe(0);
    expect(output()).toContain(`dry-run: aur sha256 of ${debUrl('1.47.112')}`);
    expect(output()).toContain(
      'dry-run: aur clone ssh://aur@aur.archlinux.org/tahti-player-bin.git',
    );
    expect(output()).toContain(
      'dry-run: aur commit "Update to 1.47.112" and push (skipped when unchanged)',
    );
  });

  it('stops before the AUR with --no-push', async () => {
    await main(['package', 'aur', '1.47.112', '--no-push', '--dry-run']);
    expect(output()).toContain('dry-run: aur print PKGBUILD and .SRCINFO');
    expect(output()).not.toContain('aur clone');
  });

  it('runs makepkg as an unprivileged user when root', async () => {
    const result = await runPackageAur('1.47.112', {
      dryRun: true,
      isRoot: true,
      workDir: '/tmp/aur-work',
    });
    expect(result.output).toContain(
      `su builduser -c \\"cd '/tmp/aur-work' && makepkg --printsrcinfo > .SRCINFO\\"`,
    );
  });

  it('rejects a missing or malformed version and unknown flags', async () => {
    await expect(main(['package', 'aur', '--dry-run'])).rejects.toThrow(
      /Missing version/,
    );
    await expect(
      main(['package', 'aur', 'player@1.0.0', '--dry-run']),
    ).rejects.toThrow(/Not a semver version/);
    await expect(
      main(['package', 'aur', '1.0.0', '--version', '--dry-run']),
    ).rejects.toThrow(/Unknown option: --version/);
  });

  it('fills only the release placeholders in the PKGBUILD template', () => {
    const template = readFileSync(
      resolve(playerRoot(), 'packaging/aur/tahti-player-bin/PKGBUILD.template'),
      'utf8',
    );
    const pkgbuild = renderTemplate(template, {
      PKGVER: '1.47.112',
      SHA256SUM: 'abc123',
    });
    expect(pkgbuild).toContain('pkgver=1.47.112');
    expect(pkgbuild).toContain("sha256sums=('abc123'");
    expect(pkgbuild).toContain(
      'releases/download/player@1.47.112/Tahti_1.47.112_amd64.deb',
    );
    expect(pkgbuild).toContain('${srcdir}/tahti-player-${pkgver}.deb');
    expect(pkgbuild).not.toContain('${PKGVER}');
  });

  it('hashes the downloaded .deb', async () => {
    const fetchImpl = vi.fn(async () => new Response('deb-bytes'));
    await expect(
      sha256OfUrl('https://example.invalid/a.deb', fetchImpl),
    ).resolves.toBe(
      '3adc870b6595ccbffaa9ccaa6fa5653652136fbeea99ffd754c52960bd0b9ea9',
    );
  });

  it('fails when the .deb is not published', async () => {
    const fetchImpl = vi.fn(
      async () => new Response('missing', { status: 404 }),
    );
    await expect(
      sha256OfUrl('https://example.invalid/a.deb', fetchImpl),
    ).rejects.toThrow(/Download failed \(404\)/);
  });
});
