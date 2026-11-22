# Track list on phones: bigger artwork, one date, tighter layout

**Status:** open

Requested 2026-11-22. The track listing still does not look good on phones.

## Problems

1. Artwork is too small.
2. The release date shows twice. Keep only the one with the clock icon.
3. The current track's thumbnail takes the whole left column.
4. Space is used poorly. It should look professional for every row size/density on phones.

## Where

- Rows: `components/AmbientTrackRow.tsx` (densities, `MediaArtwork` size, meta line), `PlayableAmbientTrackList.tsx`, `AmbientTrackList.tsx`; table view `@tahti-player/ui` `TrackTable` `ThumbnailCell` on narrow widths.
- Meta and date: `components/channel-view/channelTrackMeta.ts`, `lib/collectionTrackMeta.ts` (where the second date comes from).
- Check the channel page, artist page, collection/release page and Library at 360, 390 and 430 px wide, for each density (`trackListViewStore`).

## Done when

- One date per row (clock icon), artwork sized for phones (e.g. `thumb`/`md` rather than `sm`), the current row keeps the same column width as the rest, and titles/meta truncate cleanly.
- Storybook phone-viewport stories for each density with play tests; screenshot check at the three widths.
