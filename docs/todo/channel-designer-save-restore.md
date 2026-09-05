# Channel Designer: restore the previous save

**Status:** done (2026-09-05).

## What shipped

`ChannelDesigner.tsx`'s "Save layout" (non-`lookOnly` mode) now tracks
what's currently live vs. what was live one save ago, so an artist can
undo their most recent save:

- Added `LookSnapshot`, a type capturing every field `save()` actually
  persists: `visual`, `scheme`, `playerScheme`, `backgroundScheme`,
  `visualSettings`, `galleryMode`, `galleryImages`, `videoBackgroundUrl`,
  the four `slideshow*` fields, `overlaySettings`, `previewPreset` — the
  exact same set `applyPreset` already fully re-applies when switching
  presets, which is how the field list was confirmed complete rather
  than guessed.
- `baselineSnapshot` state always mirrors "what's currently live" —
  refreshed on `loadFromServer()` (initial load / preset-revert replay)
  and after every successful `save()`.
- `previousSave` state captures the *old* `baselineSnapshot` right
  before a save overwrites it, so it always holds exactly one save-back.
  A "Restore previous save" icon button (`Undo2Icon`, only rendered
  once `previousSave` is non-null — i.e. never before a save has
  happened, per the request) re-applies that snapshot as a new local
  draft (`setDirty(true)`) — the artist still has to press Save again to
  actually persist the revert, same as any other edit here.
- In-memory only, as the original note anticipated: nothing is written
  to `localStorage` or the server until the artist explicitly saves
  again, and it's lost on reload. Only one level of undo is tracked
  (restoring doesn't chain further back) — matches "temporarily" from
  the original request rather than building real version history.

## Verification

`tsc --noEmit`, `eslint`, `pnpm --filter @tahti-player/tahti-web test`
(467 tests, all passing), and `pnpm --filter @tahti-player/tahti-web
build` all pass. No test file exists for `ChannelDesigner.tsx`; none
added given its size and the number of existing untested code paths
already in the file. Not manually verified in a running browser — this
is a genuinely non-trivial piece of state-juggling and deserves a real
save → edit → restore → save cycle to confirm before fully trusting it.
