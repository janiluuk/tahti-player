# Studio Collection/Release/Playlist edit pages: adopt the polished view-page header

**Status:** partial

## What the user asked for

Reported 2026-09-08 with two reference images: the target look (a
Deezer/Nuclear-style single-playlist page — big cover, bold title,
one-line description, pill "Play" + "⋮" more-options button
[Add to queue / Export as JSON / Delete], a pencil edit button, a
filter bar, and a real track table with heart/thumbnail/artist/
title/duration/trash columns) vs. the current Studio Collection edit
page (`/studio/collections/$slug`), which looks like a bare admin
form — small thumbnail, an unstyled "Backdrop" placeholder box, plain
title text, separate bordered "Details" and "Tracklist" cards.
Also referenced Nuclear's own Playlists grid
(`packages/docs/.gitbook/assets/playlists.png` in the upstream
`nukeop/nuclear` repo) for the listing-page look, and the general
3-pane app-layout diagram (not directly applicable — tahti-web has its
own different shell).

## What was actually true (found this pass)

The *public* listener-facing pages already look right and don't need
touching:
- `views/CollectionView.tsx` (`/u/$username/c/$slug`) already uses
  `EntitySocialHeader` (cover+title+subtitle+description+stats+action
  buttons: Play, queue, Embed, Start a Jam, Favorite/Subscribe, and —
  when the viewer owns it — an "Edit in Studio" pencil) followed by
  `PlayableTrackTable`. This already matches the reference almost
  exactly, including the owner-only edit pencil.
- `views/SmartLinkView.tsx` (`/r/$slug`, the public release page) uses
  the same `EntitySocialHeader` + `PlayableTrackTable` pattern.
- "Playlist" isn't a separate type in this codebase — confirmed no
  `Playlist` type in `api/types.ts`, and `/studio/playlists` redirects
  to `/studio/collections` (`router.tsx`). Playlists == Collections.

The gap is specifically the **Studio edit pages**, which are
completely separate bespoke components that never adopted
`EntitySocialHeader`/`PlayableTrackTable`:
- `views/studio/StudioCollectionEditView.tsx` (1111 lines) — the one in
  the "current" screenshot.
- `views/studio/StudioReleaseDetailView.tsx` (956 lines) — same gap,
  not touched this pass.
- `views/studio/StudioPlaylistsView.tsx` exports two things: the
  `StudioPlaylistsView` list component is dead code (no route renders
  it, confirmed — `/studio/playlists` is a pure redirect), but
  `StudioPlaylistEditorView` in the same file is live, mounted at
  `/studio/playlists/$slug`, and has the same bare-form gap. Not
  touched this pass, and its relationship to
  `StudioCollectionEditView` (same conceptual entity, two separate
  edit UIs?) needs untangling before touching it.

**Nuclear reference component** (per user's "check nuclear-player"):
`packages/player/src/views/PlaylistDetail/PlaylistDetail.tsx` —
`PlaylistDetailHeader` (cover+title+actions slot) +
`PlaylistDetailActions` (Play button + `Popover` menu: Export as
JSON, Delete, icons `ShareIcon`/`Trash2Icon`) + `ConnectedTrackTable`
wrapping `packages/ui`'s `TrackTable` with
`displayThumbnail/displayArtist/displayDuration/displayDeleteButton`
— exactly the reference screenshot's column set.
`packages/ui/src/components/TrackTable/types.ts` confirms the
primitive already supports everything needed:
`features.reorderable` + `actions.onReorder(fromIndex, toIndex)` for
drag-reorder, `display.displayDeleteButton` + `actions.onRemove` for
the trash column — `PlayableTrackTable` (tahti-web's wrapper) just
hardcodes `reorderable: false` and never exposes `onRemove` today.

## Additional ask (2026-09-08, same pass)

Move the Tracklist panel's "Add content" button (`PlusIcon`, currently
a floating button pinned to the bottom-right of the Tracklist card)
into the page's top-right corner instead — i.e. into the same header
action row as Save/visibility. Also: "update the view to match
storybook components" (already true — every control here already
comes from `@tahti-player/ui`: `Badge`, `Button`, `SaveButton`,
`Dialog`, `FilePicker`, etc.; no non-Storybook bespoke controls found
to migrate) and "update any storybook references after the migration"
— no Storybook story exists for `StudioCollectionEditView` itself, and
this pass doesn't change the implementation of any shared component
that other stories reference, so nothing to update there.

## Shipped this pass: Collection edit header

`StudioCollectionEditView.tsx`'s header block (cover/backdrop upload
buttons + bare title + Save) now uses `EntitySocialHeader` — same
component, same visual shape as `CollectionView.tsx`'s public page —
with: cover + backdrop images (existing upload dialogs, now driving
`EntitySocialHeader`'s `imageUrl`/`backdropUrl`), editable title inline
(driven by the same `name`/`detailsExpanded` state that already
existed), description as the header subtitle, a Play button (reuses
the existing `playSound` logic against the first track), an
Add-to-queue button, the existing Public/Unlisted/Private badge, and
the existing Save button — all in the header's action row instead of
scattered across a separate `StudioPageHeader` block. "Edit details"
keeps its existing expand/collapse behavior for the rest of the form
fields (release date, genres, style, visibility) below the header.

**Not done — needs a decision before building, not guessed at:**
- The "⋮" menu's **Export as JSON** and **Delete collection** — no
  such capability exists anywhere in this codebase yet
  (`api/studio.ts` has no `deleteStudioCollection`/export function,
  and no other Studio view has a delete-collection flow to copy). The
  reference screenshot itself shows "Delete playlist" greyed out/
  disabled, suggesting even Nuclear treats it as a rare, guarded
  action. Building real delete is a destructive-action addition that
  needs the actual DELETE endpoint confirmed (or added) rather than
  wired up speculatively.
- **Track table swap** — the current tracklist (custom `TrackRow`,
  drag-and-drop via native HTML5 DnD, per-row waveform-decode-and-
  expand, inline embed-provider iframe playback) was **left as-is**
  rather than swapped for the shared `TrackTable` primitive. Swapping
  would get the exact heart/thumbnail/artist/title/duration/trash
  column look for free (the primitive already supports reorder +
  delete), but would also silently drop the waveform-preview-in-row
  and inline-embed-player features that don't exist in the generic
  table today — a real functional regression, not just a restyle.
  Needs a decision: keep those Studio-only features (and just improve
  the current row's visual structure — e.g. add a thumbnail column) vs.
  accept losing them for exact visual parity with the reference.

## Not started

- `StudioReleaseDetailView.tsx` — same header treatment as Collection,
  not attempted this pass.
- `StudioPlaylistEditorView` (in `StudioPlaylistsView.tsx`) — same gap,
  plus its relationship to `StudioCollectionEditView` needs untangling
  first (are these two edit UIs for the same entities, and if so why
  do both exist?).
- Nuclear's Playlists **grid/listing** page reference
  (`playlists.png`) — `MyCollectionsView.tsx` is tahti-web's
  equivalent listing page; not compared against the reference or
  touched this pass.

## Verification (header change only)

`tsc --noEmit`, `eslint`, `pnpm test` (487 tests), `pnpm build` all
pass. Verified live in a running browser (`VITE_FORCE_MOCK=1`,
`/studio/collections/favorites-mix`): header renders title/subtitle
("Playlist")/track-count stat/Play/Add-to-queue/Add-content buttons
and the Public badge + Save button; the new clickable empty-cover
placeholder (`EntitySocialHeader`'s `onImageClick` fallback when
`imageUrl` is unset) correctly opens the cover upload dialog; Details
panel's collapsed view no longer duplicates the description; Tracklist
section unaffected. No console errors.
