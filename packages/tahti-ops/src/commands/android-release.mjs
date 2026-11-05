import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { OpsError } from '../paths.mjs';
import { runProgram, runSteps } from '../run-script.mjs';

const PROJECT = 'packages/player/src-tauri/gen/android';
const TARGETS = ['aarch64', 'armv7', 'i686', 'x86_64'];

export function androidReleaseTarget(args) {
  if (args.length === 0) {
    return null;
  }
  if (
    args.length === 2 &&
    args[0] === '--target' &&
    TARGETS.includes(args[1])
  ) {
    return args[1];
  }
  throw new OpsError(
    `Usage: desktop android release [--target ${TARGETS.join('|')}]`,
  );
}

export function signingTools(env) {
  for (const key of [
    'ANDROID_KEYSTORE_PATH',
    'ANDROID_KEYSTORE_PASSWORD',
    'ANDROID_KEY_ALIAS',
    'ANDROID_KEY_PASSWORD',
  ]) {
    if (!env[key]) {
      throw new OpsError(
        `Signed APK release requires ${key}. See packages/tahti-ops/README.md.`,
      );
    }
  }
  if (!existsSync(env.ANDROID_KEYSTORE_PATH)) {
    throw new OpsError(
      'ANDROID_KEYSTORE_PATH does not point to an existing keystore.',
    );
  }
  const sdk = env.ANDROID_HOME || env.ANDROID_SDK_ROOT;
  if (!sdk) {
    throw new OpsError(
      'Set ANDROID_HOME (or ANDROID_SDK_ROOT) to your Android SDK.',
    );
  }
  const base = resolve(sdk, 'build-tools');
  const versions = existsSync(base)
    ? readdirSync(base)
        .filter((v) => /^\d+\.\d+\.\d+$/.test(v))
        .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
    : [];
  const version = versions.find(
    (v) =>
      existsSync(resolve(base, v, 'apksigner')) &&
      existsSync(resolve(base, v, 'zipalign')),
  );
  if (!version) {
    throw new OpsError(
      'Install Android SDK build-tools (apksigner and zipalign) before building a release.',
    );
  }
  const ndkBase = resolve(sdk, 'ndk');
  const ndks = existsSync(ndkBase)
    ? readdirSync(ndkBase)
        .filter((v) => /^\d+\.\d+\.\d+$/.test(v))
        .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
    : [];
  const ndk = env.NDK_HOME || (ndks[0] ? resolve(ndkBase, ndks[0]) : null);
  if (!ndk || !existsSync(ndk)) {
    throw new OpsError(
      'Install the Android NDK or set NDK_HOME before building a release.',
    );
  }
  return {
    apksigner: resolve(base, version, 'apksigner'),
    zipalign: resolve(base, version, 'zipalign'),
    ndk,
  };
}

export async function runAndroidRelease({ dryRun, extraArgs, env, root }) {
  const target = androidReleaseTarget(extraArgs);
  const tools = dryRun
    ? { apksigner: 'apksigner', zipalign: 'zipalign', ndk: env.NDK_HOME }
    : signingTools(env);
  const buildEnv = { ...env, ...(tools.ndk ? { NDK_HOME: tools.ndk } : {}) };
  const tauri = ['--filter', '@tahti-player/player', 'tauri', 'android'];
  const step =
    (program, args, label) =>
    ({ dryRun: dry }) =>
      runProgram(program, args, {
        dryRun: dry,
        env: buildEnv,
        cwd: root,
        label,
      });
  const steps = [];
  if (!existsSync(resolve(root, PROJECT))) {
    steps.push(step('pnpm', [...tauri, 'init', '--ci'], 'android init'));
  }
  steps.push(
    step(
      'pnpm',
      [
        ...tauri,
        'build',
        '--apk',
        '--ci',
        ...(target ? ['--target', target] : []),
      ],
      'android release APK',
    ),
  );
  if (dryRun) {
    steps.push(() => ({
      exitCode: 0,
      output:
        'dry-run: align APK, sign with ANDROID_KEYSTORE_PATH, verify signature, write artifacts/android/tahti-player-<version>-<target|universal>.apk and .apk.sha256',
    }));
    return runSteps(steps, { dryRun });
  }
  const built = await runSteps(steps);
  if (built.exitCode !== 0) {
    return built;
  }
  const apkDir = resolve(
    root,
    PROJECT,
    'app/build/outputs/apk/universal/release',
  );
  const apks = existsSync(apkDir)
    ? readdirSync(apkDir).filter((file) => file.endsWith('.apk'))
    : [];
  if (apks.length !== 1) {
    throw new OpsError(
      `Expected one universal release APK in ${apkDir}; found ${apks.length}.`,
    );
  }
  const version = JSON.parse(
    readFileSync(
      resolve(root, 'packages/player/src-tauri/tauri.conf.json'),
      'utf8',
    ),
  ).version;
  if (
    typeof version !== 'string' ||
    !/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(version)
  ) {
    throw new OpsError('tauri.conf.json must contain a release version.');
  }
  const temp = mkdtempSync(resolve(tmpdir(), 'tahti-android-release-'));
  const aligned = resolve(temp, 'aligned.apk');
  const signed = resolve(temp, 'signed.apk');
  try {
    const signedResult = await runSteps([
      step(
        tools.zipalign,
        ['-f', '-p', '4', resolve(apkDir, apks[0]), aligned],
        'align Android APK',
      ),
      step(
        tools.apksigner,
        [
          'sign',
          '--ks',
          env.ANDROID_KEYSTORE_PATH,
          '--ks-key-alias',
          env.ANDROID_KEY_ALIAS,
          '--ks-pass',
          'env:ANDROID_KEYSTORE_PASSWORD',
          '--key-pass',
          'env:ANDROID_KEY_PASSWORD',
          '--out',
          signed,
          aligned,
        ],
        'sign Android APK',
      ),
      step(
        tools.apksigner,
        ['verify', '--verbose', '--print-certs', signed],
        'verify Android APK signature',
      ),
    ]);
    if (signedResult.exitCode !== 0) {
      return signedResult;
    }
    const outputDir = resolve(root, 'artifacts/android');
    mkdirSync(outputDir, { recursive: true });
    const filename = `tahti-player-${version}-${target ?? 'universal'}.apk`;
    const output = resolve(outputDir, filename);
    const hash = createHash('sha256')
      .update(readFileSync(signed))
      .digest('hex');
    copyFileSync(signed, output);
    writeFileSync(`${output}.sha256`, `${hash}  ${filename}\n`);
    return {
      exitCode: 0,
      output: `Signed APK: ${output}\nChecksum: ${output}.sha256`,
    };
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}
