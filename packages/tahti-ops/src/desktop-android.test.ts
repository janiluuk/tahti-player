import { chmodSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { main } from './cli.mjs';
import { runDesktop } from './commands/desktop.mjs';

function fakeJavaPath() {
  const bin = mkdtempSync(join(tmpdir(), 'tahti-ops-bin-'));
  writeFileSync(join(bin, 'java'), '#!/bin/sh\nexit 0\n');
  chmodSync(join(bin, 'java'), 0o755);
  return bin;
}

describe('desktop android', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('is listed in desktop help', async () => {
    expect(await main(['desktop', '--help'])).toBe(0);
    const help = String(logSpy.mock.calls[0][0]);
    expect(help).toContain('desktop <run|launch|dev|bundle|android>');
    expect(help).toContain('android  ');
  });

  it('runs init first when the Android project is missing', async () => {
    const root = mkdtempSync(join(tmpdir(), 'tahti-ops-android-'));
    const result = await runDesktop('android', {
      dryRun: true,
      root,
      extraArgs: ['--open'],
    });
    expect(result.output).toBe(
      [
        'dry-run: android init — pnpm --filter @tahti-player/player tauri android init',
        'dry-run: android run (debug) — pnpm --filter @tahti-player/player tauri android run --debug --open',
      ].join('\n'),
    );
  });

  it('skips init when the Android project exists', async () => {
    const root = mkdtempSync(join(tmpdir(), 'tahti-ops-android-'));
    mkdirSync(join(root, 'packages/player/src-tauri/gen/android'), {
      recursive: true,
    });
    const result = await runDesktop('android', { dryRun: true, root });
    expect(result.output).toBe(
      'dry-run: android run (debug) — pnpm --filter @tahti-player/player tauri android run --debug',
    );
  });

  it('needs Java before building', () => {
    const empty = mkdtempSync(join(tmpdir(), 'tahti-ops-bin-'));
    expect(() =>
      runDesktop('android', {
        env: { PATH: empty, ANDROID_HOME: '/sdk' },
      }),
    ).toThrow(/Java \(JDK 17\+\) is required/);
  });

  it('needs an Android SDK before building', () => {
    expect(() =>
      runDesktop('android', { env: { PATH: fakeJavaPath() } }),
    ).toThrow(/ANDROID_HOME \(or ANDROID_SDK_ROOT\)/);
  });
});
