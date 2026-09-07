# Wire crossfade playback setting to actual audio engine

**Status:** open

Created 2026-09-07: the crossfade setting exists in the Settings panel
(playback category, number input 0–5000ms, step 50ms, i18n in 11 locales)
and the value is persisted via Tauri store, but the feature is dead —
nothing crossfades at runtime.

## Root cause

`SoundProvider.tsx` renders `<Sound>` (single audio element, no crossfade
logic) instead of `<CrossfadeSound>` (dual audio elements with crossfade
support). The `crossfadeMs` value is read from settings and stored in
`soundStore`, but never passed to a component that uses it.

## What exists today

- **Setting**: `coreSettings.ts:150-154` — `playback.crossfadeMs`, default `0`
- **Component**: `packages/hifi/src/CrossfadeSound.tsx` — full crossfade implementation, zero consumers
- **Store**: `soundStore.ts` holds `crossfadeMs`, setter exists
- **i18n**: `preferences.playback.crossfadeMs` in all locales

## Gaps in CrossfadeSound

`CrossfadeSound` accepts `SoundProps & { crossfadeMs, children }` but is
missing compared to `Sound`:

| Prop | `Sound` | `CrossfadeSound` |
|---|---|---|
| `volume` | yes (sets `audio.volume`) | destructured but never applied |
| `onCanPlay` | yes | missing |
| `onSourceInvalid` | yes | missing |

## Fix

1. **`CrossfadeSound.tsx`** — apply `volume` to active audio element,
   add `onCanPlay` callback wiring, add `onSourceInvalid` callback wiring.
2. **`SoundProvider.tsx`** — import `CrossfadeSound`, conditionally render
   `<CrossfadeSound crossfadeMs={crossfadeMs}>` when `crossfadeMs > 0`,
   fall back to `<Sound>` when `0`. Pass all existing callbacks through.

## Verification

- Existing integration test `Sound.test.tsx` "crossfades on src change when
  crossfadeMs > 0" should exercise the new path.
- Manual: set crossfade to e.g. 3000ms in Settings, play two tracks,
  confirm overlap during transition.
