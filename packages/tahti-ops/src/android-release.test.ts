import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  androidReleaseTarget,
  signingTools,
} from './commands/android-release.mjs';
import { runDesktop } from './commands/desktop.mjs';

const SIGNING_ENV = {
  ANDROID_KEYSTORE_PATH: '/nonexistent/release.jks',
  ANDROID_KEYSTORE_PASSWORD: 'secret',
  ANDROID_KEY_ALIAS: 'tahti',
  ANDROID_KEY_PASSWORD: 'secret',
};

function fakeSdk() {
  const sdk = mkdtempSync(join(tmpdir(), 'tahti-ops-sdk-'));
  mkdirSync(join(sdk, 'build-tools/35.0.0'), { recursive: true });
  writeFileSync(join(sdk, 'build-tools/35.0.0/apksigner'), '');
  writeFileSync(join(sdk, 'build-tools/35.0.0/zipalign'), '');
  mkdirSync(join(sdk, 'ndk/27.0.12077973'), { recursive: true });
  const keystore = join(sdk, 'release.jks');
  writeFileSync(keystore, '');
  return { sdk, keystore };
}

describe('desktop android release', () => {
  it('accepts no target or one known --target', () => {
    expect(androidReleaseTarget([])).toBeNull();
    expect(androidReleaseTarget(['--target', 'aarch64'])).toBe('aarch64');
    expect(() => androidReleaseTarget(['--target', 'mips'])).toThrow(
      /Usage: desktop android release/,
    );
    expect(() => androidReleaseTarget(['--open'])).toThrow(/Usage/);
  });

  it('dry run inits, builds the APK, then describes signing', async () => {
    const root = mkdtempSync(join(tmpdir(), 'tahti-ops-android-'));
    const result = await runDesktop('android', {
      dryRun: true,
      root,
      extraArgs: ['release', '--target', 'aarch64'],
    });
    expect(result.exitCode).toBe(0);
    expect(result.output.split('\n')).toEqual([
      'dry-run: android init — pnpm --filter @tahti-player/player tauri android init --ci',
      'dry-run: android release APK — pnpm --filter @tahti-player/player tauri android build --apk --ci --target aarch64',
      expect.stringMatching(/^dry-run: align APK, sign .*\.apk\.sha256$/),
    ]);
  });

  it('skips init when the Android project exists', async () => {
    const root = mkdtempSync(join(tmpdir(), 'tahti-ops-android-'));
    mkdirSync(join(root, 'packages/player/src-tauri/gen/android'), {
      recursive: true,
    });
    const result = await runDesktop('android', {
      dryRun: true,
      root,
      extraArgs: ['release'],
    });
    expect(result.output.split('\n')[0]).toBe(
      'dry-run: android release APK — pnpm --filter @tahti-player/player tauri android build --apk --ci',
    );
  });

  it('names the first missing signing variable', () => {
    expect(() =>
      signingTools({ ...SIGNING_ENV, ANDROID_KEY_ALIAS: '' }),
    ).toThrow(/requires ANDROID_KEY_ALIAS/);
  });

  it('needs the keystore file to exist', () => {
    expect(() => signingTools(SIGNING_ENV)).toThrow(
      /does not point to an existing keystore/,
    );
  });

  it('needs an Android SDK location', () => {
    const { keystore } = fakeSdk();
    expect(() =>
      signingTools({ ...SIGNING_ENV, ANDROID_KEYSTORE_PATH: keystore }),
    ).toThrow(/Set ANDROID_HOME/);
  });

  it('finds apksigner, zipalign and the NDK in the SDK', () => {
    const { sdk, keystore } = fakeSdk();
    const tools = signingTools({
      ...SIGNING_ENV,
      ANDROID_KEYSTORE_PATH: keystore,
      ANDROID_HOME: sdk,
    });
    expect(tools.apksigner).toBe(join(sdk, 'build-tools/35.0.0/apksigner'));
    expect(tools.zipalign).toBe(join(sdk, 'build-tools/35.0.0/zipalign'));
    expect(tools.ndk).toBe(join(sdk, 'ndk/27.0.12077973'));
  });

  it('needs the SDK build-tools', () => {
    const { keystore } = fakeSdk();
    const empty = mkdtempSync(join(tmpdir(), 'tahti-ops-sdk-'));
    expect(() =>
      signingTools({
        ...SIGNING_ENV,
        ANDROID_KEYSTORE_PATH: keystore,
        ANDROID_HOME: empty,
      }),
    ).toThrow(/build-tools/);
  });
});
