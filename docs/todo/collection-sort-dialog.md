# Collection sounds: Sort dialog + Move to top

**Status:** partial

User request 2026-11-08 (screenshot: "Sort Sounds" modal — Sort by select,
"Drag an entry, or focus it and move it with the arrow keys", numbered rows
with drag handle, artwork, title, date; Cancel / Save order).

## Want

- An **icon button** on the collection (Studio collection edit / Tracklist
  panel, and the owner's collection page) that opens a **Sort sounds** modal.
- **Sort by** select with the obvious modes: Own order, Latest first, Oldest
  first, Title A–Z, Title Z–A (maybe Duration). Choosing a computed mode
  previews the order in the list; Save stores it.
- Rows: drag handle, position number, `MediaArtwork` (seeded), title, date;
  keyboard move (arrow keys) like `ProfileOrderDialog`.
- **Arrow keys move rows** (user, 2026-11-08): clicking (or tabbing to) a
  row's drag handle picks the row up; ArrowUp/ArrowDown move it one step,
  Home/End to top/bottom, Enter/Escape/click drops it; focus stays on the
  handle as it moves and a live region announces "Moved to position 3 of 40".
  Verify this works with the mouse-click-then-arrows flow, not only Tab focus.
- A **Move to top** icon button per row (and probably Move to bottom), so long
  collections don't need dragging an item from the bottom.
- Cancel discards; Save order persists.

## Shipped (web, 2026-11-08)

`components/SortSoundsDialog.tsx` behind a Sort sounds icon button on the
Studio collection editor's Tracklist panel (edit mode, 2+ items): Sort by
Own order / Newest first / Oldest first / Title A–Z / Title Z–A, numbered
rows with drag handle, `MediaArtwork`, title and date; drag, or click the
handle and use ArrowUp/ArrowDown/Home/End (focus stays on the handle, a live
region announces the new position); Move to top / Move to bottom per row.
Save sends the shown order to `PUT /api/me/collections/:slug/reorder` and
sets `trackSortMode` TIME/NAME for Oldest first / A–Z; Newest first and Z–A
are saved as own order. Helpers in `lib/sortSounds.ts` (tested), story
`SortSoundsDialog.stories.tsx`.

## Left

- tahti-org: direction-aware sort modes so Newest first / Z–A stay sorted
  when new sounds are added (today they are saved as a fixed own order).
- The same button on `StudioPlaylistEditorView` (/studio/playlists) and the
  owner's public collection page.
- Check the public read paths apply the stored mode (see below).

## What exists

- Web: `ProfileOrderDialog` (`components/ProfileOrderDialog.tsx`, used by
  `views/studio/sounds/TrackOrderButton.tsx` for the profile track grid) already
  has the drag + arrow-key list; reuse/extend it rather than build another.
- Web client: `api/studio/studio-collections.ts` calls
  `PUT /api/me/collections/:slug/reorder`.
- API (`../tahti-org`): `COLLECTION_TRACK_SORT_MODES = MANUAL | TIME | NAME`
  (`packages/shared/src/dto/collection.ts`); `sortCollectionItems` in
  `apps/api/src/routes/collections/helpers.ts` sorts TIME oldest-first and
  NAME A–Z at display time only.

## Backend work (tahti-org)

- Extend sort modes with direction (`TIME_DESC`/latest first, `NAME_DESC`) or a
  separate `trackSortDirection`; keep `MANUAL` = own order.
- Check every public read path (collection page, embed, channel catalog, RSS)
  applies the stored mode — memory notes public routes ignored `trackOrder`.
- Optionally "Save as own order": write positions from a computed sort so the
  artist can start from Latest and then tweak by hand (no new route needed;
  reorder endpoint takes the full id list).

## Done when

Icon button opens the modal on a collection with 50+ sounds; each sort mode
previews and saves; Move to top works by mouse and keyboard; the public
collection page shows the saved order; Storybook story + unit test for the
dialog; tahti-org PR for the sort-mode change if needed.
