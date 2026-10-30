# UX and design-system backlog

**Status:** open

One place for the open UI/UX polish work. Consolidates (2026-10-20):
`ux-sweep-30-slices.md`, `ux-sweep-batch-4.md`, `ux-sweep-batch-91-120.md`,
`catalog-components-empty-states.md`, `listen-ui-liveliness.md`,
`ambient-waveform-track-rows.md`, `view-modes-track-tables.md`,
`profile-surfaces-unification.md`, `studio-artist-usability.md`. What those
shipped is in HISTORY. Audits still being worked on keep their own files:
[navigation-flow-audit.md](navigation-flow-audit.md),
[ui-nav-audit.md](ui-nav-audit.md), [channel-page-redesign.md](channel-page-redesign.md).

Rule of thumb: library components only (`@tahti-player/ui`), Storybook story per
new surface, one PR per row.

## Small slices (from the sweeps)

- [x] `FeatureRequestsView` comments → `PageEmpty` (already on master)
- [x] `ProcessingIndicator` (top bar) → `Badge` (already on master)
- [x] `HeaderStyleTabs` → catalog `Tabs` (already on master)
- [x] `ArtistReferenceSections` → `SectionTitle` (already on master)
- [x] History list active-row accent (already on master)
- [x] `GovernanceView` "No motions returned." → `PageEmpty` (already on master)
- [x] History / Releases filter: clear-filter (batch 79; HelpView already clears)
- [x] `ReleasesPanel` filtered-empty + clear (batch 79)
- [x] Thirty-two more list empties use `PageEmpty` (batch 113): events,
  delivery reports, smart-link tracks, chat bans / messages, moderators,
  sounds, track sales, channel playlist and chat, stats top lists, release
  credits and fingerprint, take morph, revenue Stripe / tiers / disbursements,
  Discover and channel add-on gates, lightbox, notifications, posts and
  drafts, collections, recordings, add-to-playlist, global search, stash,
  studio home broadcasts.
- [x] Thirty more list empties use `PageEmpty` (batch 114): fan room, local
  playlists, Radio Browser, release stats and versions, studio releases and
  playlists, history, venues, profile sections, plugin store, help, desktop
  library, channel comments, discover widgets, upload recordings, smart
  links, disco widgets, browser local files. Load errors and access gates stay.
- [x] Paragraph empties, confirm-before-delete, and undo on create (batch 115):
  E2E gallery, association profile, upcoming shows, Bandcamp and SoundCloud
  import empties, discussion replies, meeting conflicts, report versions,
  editor seed, release library picker, show slots. Events, theme submissions,
  radio presets, stream destinations, conflict notes, comments, and disco
  widgets confirm before remove. Event, post, share, destination, and comment
  creates can be undone.
- [x] Composer submit and release artwork (batch 119): news headline and
  read-more use `Button` / `ButtonAnchor`. Radio approval, news publish,
  account suspension, theme import, radio booking and the next-broadcast
  save submit from the text area. Studio release artwork uses
  `CoverArtPickerDialog` and keeps From URL and Generate.

## Liveliness

- [ ] De-green `Button` (primary-heavy everywhere; Cards and the MediaArtwork
  overlay were already neutralised). Partial: Governance attention panel +
  stream PlaylistDialog selected row (batch 81).
  - 2026-10-30: quieted jumps that were sitting next to a real action
    or beside an already-secondary control: smart-link empty Create
    release, container logs, back to the channel, Pro editor, gallery
    Done, Go Live to record, A/B switch, and the channel live-chat
    notice. Saves, plays, uploads, and empty-state setup (Stripe, tiers)
    stay green.
  - 2026-10-30 (batch 120): add-on Reject is danger; Open Storybook and the
    MusicBrainz "open prefilled editor" links are secondary. Primary
    confirms (Rename, Add to queue, Play, Download) stay green.
  - 2026-10-30 (batch 117): channel announcement confirm Delete and Cancel
    the election use danger; the selects picker Cancel and the download
    gate Copy link use secondary. Primary actions on those screens stay.
  - 2026-10-27: Settings → Add-ons import cards - per-row Import (Bandcamp
    albums, SoundCloud tracks), the hearthis.at Search submit and the
    disabled Soulseek "Desktop only" are `secondary`; Connect / Import all /
    Import selected stay primary.
  - 2026-10-27: Studio list views - per-row Edit / Send / open-in-editor and
    the empty-state duplicate of the header "+" are `secondary`; the header
    "+" and dialog submits stay primary (Playlists, Collections, Releases,
    Editor, Updates).
- [x] Optional `DiscoverGatewayBackground` on flat Listen surfaces (batch 80).

## Track lists: ambient rows, view modes, sort

- [x] `StudioShowsView` search + clear (already); `MyVenuesView` search + clear (batch 80).
- [x] Library trio (`LibraryMediaView` / `LibraryEmbedsView` /
  `LibrarySmartLinksView`): converge on a shared library row with FilterChips +
  sort (pattern: `studio/sounds/SoundFilters.tsx`). Partial: Embeds FilterChips +
  SmartLinks search (batch 80); Media kind chips + SmartLinks DSP chips + load
  `PageError` (batch 81); Embeds PageError even with partial data (batch 82);
  shared `LibrarySectionToolbar` on Media + SmartLinks (batch 83); Embeds
  (batch 85); client sort Select on Media/Embeds/SmartLinks (batch 87).
  - 2026-10-27: Media (file name) and Embeds (title) get the toolbar search
    SmartLinks already had, and all three use one `LibraryFilteredEmpty`
    (names the search, one button clears search and chips).
  - 2026-10-30: Media, Embeds and Smart links share `LibraryItemRow`
    (art, title, detail, actions). Media keeps a thumbnail or video in
    the row. An embed still opens the provider widget from that row.

## Shared surfaces (de-duplication)

- [x] One entity-profile section stack (tracks table + releases grid +
  collections grid) for ArtistView and ChannelView
  (`artist-view/ArtistReferenceSections.tsx` vs `channel-view/ChannelViewBlocks.tsx`).
  - 2026-10-27 (batch 90): shared `ProfileSection` (heading + loading /
    error / empty) on the artist popular, related, releases and playlists
    sections and the channel Tracks block. Left: one tracks list for both
    (channel blocks wait on the ambient-rows item) and a releases / playlists
    grid on the channel page.
  - 2026-10-30: the channel Tracks block loads the public profile and
    shows the same releases grid and playlists grid as the artist page
    (loading, error with retry, empty, play, queue, favorite, tracklist).
    Radio channels skip them.
- [x] One collection surface for CollectionView / SmartLinkView /
  StudioCollectionsView (same track list + empty message, rendered 3×).
  - 2026-10-27 (batch 90): shared `CollectionTrackList` (framed ambient
    rows + empty state) on CollectionView and SmartLinkView; a smart link
    with no playable and no locked tracks now says so. Left: StudioCollectionsView
    lists collections, not tracks; the Studio editor tracklist
    (`collection-edit/TracklistPanel.tsx`, reorderable `TrackTable`) still
    has its own empty state.
  - 2026-10-30: the editor's empty tracklist uses `CollectionTrackList`.
    Studio → Collections still lists collections, not tracks.
- After moving files, update `docs/VIEW-CATALOG.md`.

## Studio functional

- [ ] Undo for publish / create flows (none in Studio).
  - 2026-10-27 (batch 90): Studio > Collections new-collection toast has
    Undo (`DELETE /api/me/collections/:slug`), which also leaves the new
    collection's editor. Left: other create paths (playlists view, add-to-
    playlist, save queue), sound shares, editor projects, events.
  - 2026-10-27 (batch 90): new-release toast has Undo (`DELETE
    /api/me/releases/:id`), via shared `lib/undoToast.ts`.
  - 2026-10-27 (batch 90): release publish toast has Undo (PATCH
    `state: DRAFT`), via shared `lib/undoToast.ts`. The follower notice and
    social post queued on publish are not recalled.
  - 2026-10-30 (batch 117): a local playlist create or duplicate toast can
    undo by deleting that playlist and reloading the list. Cloud collection
    track adds still have no item id to delete.
  - 2026-10-30 (batch 116): listening party, lineup member, moderator,
    discussion reply, release tracks, pinned announcement, announcement clip,
    artwork preset, radio station, SoundCloud embed, stash upload, gallery
    photos, smart-playlist snapshot, and queue adds.
  - 2026-10-30 (batch 118): API token create, release track to rotation,
    station by URL, and Studio collection editor add sound.
  - 2026-10-30 (batch 121): Mikseri, Mixcloud and Spotify collection imports
    (item found by the returned sound id after a tracklist refresh). Left:
    collaborative-playlist adds (no item id and no contributor remove).

