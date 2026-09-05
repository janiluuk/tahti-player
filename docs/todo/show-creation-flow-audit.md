# Show creation flow: what already existed vs. what was missing

**Status:** done (2026-09-05). Most of the requested feature was already
built; only the auto-fill was actually missing.

## Investigation

The queued item asked for three things without pinning down which view
they lived in. Located all three:

1. **"Toggle between One-off show and New episode (of an existing
   series)"** — already exists: `BroadcastPreflightPanel.tsx`'s "Series
   episode" `Select` (touched earlier today in the same session for its
   dropdown conversion) already has a "One-off broadcast" option plus
   one entry per existing series.
2. **"If the artist has no shows/series yet, show a CTA to create
   one"** — already exists: `StudioShowsView.tsx`'s empty state
   (`shows.length === 0`) already renders an `EmptyState` with a "New
   show" button opening the same create-series dialog used elsewhere on
   that page.
3. **"Auto-fill the show form's fields from the selected series
   show"** — this was the one actually missing. Picking a series from
   `BroadcastPreflightPanel`'s "Series episode" `Select` only set
   `seriesId`; the Title field stayed whatever it was.

## Fix

When a series is picked and the Title field is currently empty,
auto-fill it as `"<Series title> — Episode <next number>"` — the exact
same convention `StudioShowDetailView.tsx` already uses for its own
`defaultEpisodeTitle` when creating an episode from within a show's own
detail page. Doesn't overwrite a title the artist already typed.
Tagline wasn't auto-filled — `series` here only carries `{id, title,
nextEpisodeNumber}` (no description/tagline data is fetched for the
list), so there was nothing to fill it from without an extra fetch;
left it manual.

## Verification

`tsc --noEmit`, `eslint`, `pnpm --filter @tahti-player/tahti-web test`
(467 tests, all passing), and `pnpm --filter @tahti-player/tahti-web
build` all pass. Not manually verified in a running browser.
