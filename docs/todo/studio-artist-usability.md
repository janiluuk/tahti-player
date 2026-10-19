# Studio usability for artists — stats, bulk actions, search, quick actions

**Status:** open

2026-10-19 sweep of `packages/tahti-web/src/views/studio/` (+ `MyDiscographyView`,
`MyVenuesView`, `GreenRoomView`) after the user flagged "more usability for artists
needed". The 2026-09-06 Studio/Admin sweep covered visual consistency only; all
functional gaps below are new.

## Tasks (suggested order)

1. **Per-entity stats** — the biggest discoverability win. Global Stats is channel-wide
   only; there is no `releaseId`/`soundId` filter param in `stats/useStatsData.ts`, and no
   per-release stats surface (release detail tabs are
   overview/smart-links/credits/versions/fingerprinting/export in
   `studio/release-detail/releaseDetailTabs.ts`). `stats/TopListsTab.tsx:78-81,101-104`
   deep-links to the sound **Details** tab, not Insights. Release rows in
   `StudioReleasesView.tsx` offer no stats shortcut. Add: per-release stats view +
   top-lists deep-link to the right tab + a stats shortcut on release rows.
2. **Bulk selection** — no checkbox/multiselect in any studio list. Adding N tracks to a
   playlist is N × (open panel → pick → close);
   `components/AddToPlaylistPanel.tsx:22-27` takes a single `soundId`.
   Target `sounds/SoundsList.tsx` (virtualized rows) + add-to-playlist and add-to-release
   from a selection.
3. **Search parity** — `StudioReleasesView.tsx` and `StudioShowsView.tsx` load everything
   with no search input (Sounds ✓ `SoundFilters.tsx`, Collections ✓, Playlists ✓,
   MyDiscography ✓).
4. **Release lifecycle** — no delete-release action in `StudioReleasesView.tsx` (create +
   pin only, `ReleasePinButton.tsx`); the overview TrackTable
   (`StudioReleaseDetailView.tsx:333-383`) lacks the per-track editor link that smart-link
   rows have (`ReleaseTrackRow.tsx:137-145`).
5. **Row quick actions** — Collections rows: no delete-item / play / visibility toggle
   (`StudioCollectionsView.tsx`); MyDiscography rows: no share / download / delete
   (`MyDiscographyView.tsx`).
6. **Feedback drift** — inline `msg` `<p>` vs sonner toast mixed on the same screen:
   `StudioReleasesView.tsx:155-156`, `StudioShowsView.tsx:125-126`,
   `StudioPlaylistsView.tsx:117-118`, `StudioCollectionsView.tsx:228`,
   `StudioScheduleView.tsx:126-128`. Publish/create flows have no undo; release-create
   failure blocks the success confirmation.

## Verify

- Storybook for new panels (story-first per AGENTS).
- `pnpm --filter @tahti-player/tahti-web type-check && lint && test`.
- Studio nav flows re-checked in the three governance contexts where chrome differs.
