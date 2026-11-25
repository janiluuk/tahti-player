import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { main } from './cli.mjs';

describe('tahti-ops ci digest', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  const lines = () =>
    logSpy.mock.calls
      .map((call) => String(call[0]))
      .join('\n')
      .split('\n');

  it('is listed in help', async () => {
    await main(['--help']);
    expect(lines().join('\n')).toContain('tahti-ops ci digest');
  });

  it('dry-runs only the digest build by default', async () => {
    expect(await main(['ci', 'digest', '--dry-run'])).toBe(0);
    expect(lines()).toEqual([
      'dry-run: ci digest build — node scripts/ci/build-snapshot-digest.mjs',
    ]);
  });

  it('dry-runs baseline, build and gate in CI order', async () => {
    expect(
      await main(['ci', 'digest', '--baseline', '--gate', '--dry-run']),
    ).toBe(0);
    expect(lines()).toEqual([
      'dry-run: ci digest baseline — bash scripts/ci/fetch-snapshot-baseline.sh ci.yml snapshot-digest',
      'dry-run: ci digest build — node scripts/ci/build-snapshot-digest.mjs',
      'dry-run: ci digest gate — node scripts/ci/should-fail-core-tests.mjs',
    ]);
  });

  it('rejects unknown flags', async () => {
    await expect(main(['ci', 'digest', '--nope'])).rejects.toThrow(
      /tahti-ops ci digest --help/,
    );
  });
});
