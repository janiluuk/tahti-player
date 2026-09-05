# Stream overlay: auto-fill title/subtitle, avatar placeholder for cover

**Status:** partial
placeholder is blocked on the same missing backend field as the
already-documented Stream Manager artwork item.

## Shipped

### Title/subtitle auto-fill from "the current show"

`StreamOverlayEditor.tsx` now also fetches `fetchBroadcastPreflight()`
(the artist's configured show title/tagline, already used by
`BroadcastPreflightPanel`) alongside its existing `fetchStreamOverlay()`
call. When the saved overlay title/subtitle are empty, they default to
the preflight's `title`/`tagline` instead of staying blank. This only
seeds the local draft — nothing is written until the artist presses
Save, and an already-set custom overlay title/subtitle is never
overwritten. The tagline-blank-skips-rendering behavior the request
also asked for was already correct (`OverlayTextPreview` already
conditionally renders the subtitle line only when non-empty).

**Read "the current show" as the artist's configured show info
(`BroadcastPreflightPanel`'s title/tagline), not a live now-playing
track feed** — the overlay is a *static* baked-in video frame (per its
own doc comment), so a per-track-changing default would be a worse fit
than the artist's own show name/tagline.

### Cover placeholder shows the artist's avatar instead of a bare icon

Also fetches `fetchMeProfile()` for `avatarUrl`. When no custom overlay
cover is set, the cover slot now shows the artist's avatar (at reduced
opacity, to read as "this is a fallback, not your real cover") instead
of a generic `ImageIcon`. This makes the editor's own preview honest —
`HelpLayer`'s copy already says "Leave the cover blank to use your
avatar," but the placeholder previously didn't visually reflect that.

## Not shipped: now-playing track artwork as the placeholder

The request's literal ask was to show the *currently-playing track's*
artwork as the placeholder, not the avatar. Investigated: there is no
now-playing-track-artwork data source available anywhere in this flow
— same root cause already documented in
`docs/todo/queued-ux-fixes-2026-09-05.md`'s Stream Manager artwork item:
`ProgrammeItem` (the rotation/now-playing type) carries no artwork
field, and no endpoint currently returns one for the channel's live
rotation state. Substituted the avatar (a real, already-correct
fallback per the component's own documentation) rather than inventing
fake data or leaving the request half-satisfied with nothing.

## Verification

`tsc --noEmit`, `eslint`, `pnpm --filter @tahti-player/tahti-web test`
(467 tests, all passing), and `pnpm --filter @tahti-player/tahti-web
build` all pass. Not manually verified in a running browser.
