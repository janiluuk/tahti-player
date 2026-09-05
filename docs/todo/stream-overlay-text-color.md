# Stream overlay: artist-configurable text color

**Status:** partial

## Remaining

opacity/scrim remaining
attempted — flagged below. Backend half shipped to the sibling `tahti`
repo's already-open PR #441, still awaiting review/merge.

## Cross-repo scope

This queued item ("color picker for the title/subtitle text color")
needed a new persisted field, so it spans both repos:

- **`tahti` (main, backend)**: added `Channel.streamOverlayTextColor`
  (nullable hex string) via a new migration on the same branch as the
  already-open PR #441 (`feat/stream-overlay-show-title-toggle` —
  chose to extend that branch rather than open a second PR, since it's
  the same table/DTO/route/orchestrator function). Updated
  `ChannelStreamOverlayPatchSchema`, the `/api/me/channel/stream-overlay`
  GET/PATCH route, and `buildRtmpMirrorOutput` in the orchestrator —
  when set, the chosen color now replaces the previously-hardcoded
  `0xffffff` (title) / `0xcbd5e1` (subtitle) Liquidsoap color literals
  for both text layers; null keeps the historical colors exactly.
  13 orchestrator tests (3 new) and 15 API route tests (2 new) passing;
  `tsc` clean on `@tahti/api`, `@tahti/orchestrator`. Pushed to the PR
  branch — **not merged**, per this session's standing practice of
  never merging PRs without the user's own review.
- **`tahti-player` (this repo, frontend)**: `StreamOverlayEditor.tsx`
  gained a color-swatch input (same `type="color"` pattern as
  `ColorSchemeFields.tsx` on the Channel Designer side) with a
  "Reset to default colors" icon button, and the live cover preview
  (`OverlayTextPreview`) now renders the title/subtitle text in the
  chosen color. `StreamOverlay` type and `broadcast.ts`'s mock/fallback
  values updated to include the new field.

**This won't actually take effect until PR #441 is merged and the main
`tahti` stack is redeployed** — until then, the color picker UI works
(saves/loads fine against a backend that doesn't have the column yet,
since Zod strips unrecognized fields rather than erroring — Prisma's
`update`/`select` would simply never see or expose it), but the field
is inert.

## Not attempted: opacity/scrim layer toggle

Investigated the real Liquidsoap RTMP output (not just the frontend
preview): `buildRtmpMirrorOutput` has **no scrim/darkening layer at
all** today — the gradient-behind-text look only exists in
`OverlayTextPreview`'s own CSS, as a preview aesthetic choice, not
something baked into the actual broadcast video. Implementing a real
toggle means adding an actual semi-transparent rectangle/image layer to
the Liquidsoap script — Liquidsoap's `video.add_image`/`video.add_text`
primitives (the only ones already verified working against
`savonet/liquidsoap:v2.2.5` in this exact file, per its own doc
comment) don't obviously include a plain solid-rectangle-fill call, and
guessing at new video-composition syntax without a live Liquidsoap
runtime to test against risks silently breaking every channel's
multistream mirroring in production — a much higher blast radius than
a typical frontend bug. Needs either Liquidsoap documentation research
or a live test environment before attempting; not guessed at here.

## Verification

tahti-player: `tsc --noEmit`, `eslint`, `pnpm --filter
@tahti-player/tahti-web test` (467 tests, all passing), `pnpm --filter
@tahti-player/tahti-web build` all pass. tahti: `tsc` clean on
`@tahti/api`/`@tahti/orchestrator`/`@tahti/shared`, `eslint` clean
(two `no-restricted-syntax` false positives on legitimate hex-color
test data worked around with named constants + a documented
`eslint-disable-next-line`, not a config change), orchestrator's 13
`buildRtmpMirrorOutput` tests and the API's 14 `sound.test.ts` tests
all passing against a real (locally `db push`-synced) Postgres. Not
manually verified in a running browser, and the real Liquidsoap output
was never rendered/watched — only its generated script string was
tested.
