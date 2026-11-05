# Streamlined Android APK release

**Status:** partial

## Done

- [x] `tahti-ops desktop android release [--target …]` (`pnpm build:android:release`): build, zipalign, apksigner sign and verify, APK and `.sha256` in `artifacts/android`; clear errors for missing signing variables, keystore, SDK, build-tools and NDK; `--dry-run`.
- [x] `.github/workflows/release-android.yml`: manual (`workflow_dispatch`) or reusable (`workflow_call`) build of an existing `player@X.Y.Z` tag, artifact upload, publish to the GitHub Release only when asked.
- [x] `release-player.yml` calls it after the desktop release when `ANDROID_RELEASES_ENABLED` is `true` (replaces the disabled inline job).
- [x] Docs in `packages/tahti-ops/README.md`; unit tests in `packages/tahti-ops/src/android-release.test.ts`.

## Left

- [ ] Add the repository secrets (`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`) and run **Android APK** once on a real tag. Blocked on the release keystore (owner).
- [ ] A real local signed build on a machine with the SDK, NDK and keystore.
- [ ] Set `ANDROID_RELEASES_ENABLED=true` once the manual run works.
