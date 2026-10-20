import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { main } from './cli.mjs';
import { readEnvFile } from './commands/e2e.mjs';

describe('shortcut commands', () => {
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

  const output = () =>
    logSpy.mock.calls.map((call) => String(call[0])).join('\n');

  it('lists the new commands in help', async () => {
    await main(['--help']);
    for (const command of ['desktop', 'test', 'e2e', 'snapshots']) {
      expect(output()).toContain(`tahti-ops ${command}`);
    }
  });

  it('dry-runs desktop build + launch', async () => {
    expect(await main(['desktop', 'run', '--dry-run'])).toBe(0);
    expect(output()).toBe('dry-run: desktop build + launch');
  });

  it('rejects an unknown desktop mode', async () => {
    await expect(main(['desktop', 'nope'])).rejects.toThrow(
      /Unknown desktop mode/,
    );
  });

  it('runs every test group by default and passes args after --', async () => {
    expect(await main(['test', '--dry-run'])).toBe(0);
    expect(output()).toBe('dry-run: test all — pnpm test');
    logSpy.mockClear();
    await main(['test', 'web', '--dry-run', '--', 'src/a.test.tsx']);
    expect(output()).toBe(
      'dry-run: test web — pnpm --filter @tahti-player/tahti-web test -- src/a.test.tsx',
    );
  });

  it('dry-runs the e2e kinds', async () => {
    await main(['e2e', 'journeys', 'artist', '--dry-run']);
    await main(['e2e', 'tasks', 'listener', '--dry-run']);
    await main(['e2e', 'playwright', '--dry-run']);
    expect(output()).toContain('e2e journeys artist (mock app)');
    expect(output()).toContain('listener-tasks-journey.mjs');
    expect(output()).toContain('pnpm test:e2e');
  });

  it('updates snapshot groups and reports what changed', async () => {
    await main(['snapshots', 'update', 'ui', 'player', '--dry-run']);
    expect(output()).toContain('snapshots ui — pnpm exec vitest run -u');
    expect(output()).toContain('snapshots player — pnpm exec vitest run -u');
    expect(output()).toContain(':(glob)packages/player/**/*.snap');
  });

  it('limits a snapshot update to one test file', async () => {
    await main([
      'snapshots',
      'update',
      'ui',
      '--only',
      'packages/ui/src/components/Dialog/Dialog.test.tsx',
      '--dry-run',
    ]);
    expect(output()).toContain(
      'vitest run -u src/components/Dialog/Dialog.test.tsx',
    );
  });

  it('dispatches the web deploy workflow with --ci', async () => {
    await main(['deploy', 'web', '--ci', '--dry-run']);
    expect(output()).toContain(
      'gh workflow run deploy-tahti-web-selfhosted.yml --ref master',
    );
  });

  it('reads credentials from an env file', () => {
    const dir = mkdtempSync(join(tmpdir(), 'tahti-ops-env-'));
    const path = join(dir, 'e2e.env');
    writeFileSync(
      path,
      '# creds\nTAHTI_E2E_EMAIL=a@b.c\n\nTAHTI_E2E_PASSWORD="x y"\n',
    );
    expect(readEnvFile(path)).toEqual({
      TAHTI_E2E_EMAIL: 'a@b.c',
      TAHTI_E2E_PASSWORD: 'x y',
    });
  });
});
