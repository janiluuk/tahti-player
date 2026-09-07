# Sounds view: empty library in production + sort control redesign

**Status:** open
Reported 2026-09-08, not investigated yet.

## 1. Production bug: user's library shows empty under Sounds

User reports they can no longer see any of their library under
Sounds (`/library/sounds`) in production — screenshot shows the
"All (0)" empty state ("No sounds yet — Upload or import audio to
start your archive.") even though they have existing sounds.

`/library/sounds` renders `MyDiscographyView.tsx`, which fetches via
`fetchStudioSounds()` (`api/studio.ts`) → real API path
`GET /api/me/archive`. On a non-mock failure, `allowMockFallback()`
gates the fallback — when that's false (as it should be in
production), the catch block returns `{ data: [], meta:
apiErrorMeta(err) }` **silently**: no error is surfaced to the UI,
so a real backend/auth failure renders identically to "you truly have
no sounds yet." That's the first thing to rule in/out — check
`meta.source`/`apiErrorMeta` handling in `MyDiscographyView` (does it
even read `meta` to distinguish "empty" from "failed"?), then check
`/api/me/archive` itself (auth, channel scoping, recent backend
changes) before assuming it's a frontend bug.

Not caused by this session's Library-path or Perform→Broadcast nav
work (PRs #25–27) — `MyDiscographyView.tsx` and `/api/me/archive`
were untouched by those changes, and none of that work is deployed to
production yet.

## 2. Sort control redesign

Screenshot: the "Sort all sounds" control currently sits in its own
labeled block (label above a `Select`) to the right of the
All/Pinned/Private/Processing/Public filter chips, on its own visual
row below the search field.

Ask:
- Move the sort selector into the top bar (same row as the filter
  chips / search), dropping the "Sort all sounds" header label.
- Swap the current `Select`-based control for the shared
  `DropdownButton` component (`packages/ui/src/components/
  DropdownButton`, see `packages/storybook/src/
  DropdownButton.stories.tsx` for usage) instead of a labeled
  `Select`.

Starting point: `MyDiscographyView.tsx` around line 238 (`label="Sort
all sounds"`) — the `SORT_OPTIONS`/`SortKey` state is already there;
this is a presentational swap, not new sort logic.
