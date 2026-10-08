# Library `Button` everywhere in tahti-web

**Status:** partial

`CLAUDE.md` says tahti-web UI must use `@tahti-player/ui` components, with no hand-rolled `<button>` where a library component covers the case. A count on 2026-10-08 found 70 raw `<button>` elements in `packages/tahti-web/src` (tests and stories left out).

## Done (2026-10-08)

- The listener pages (#563): Discover, News, the artist directory, the top search results, the phone tab bar and player bar, the channel stage and backdrop nav, the track dialog's tracklist, embed rows, "Manage widgets", the page tour and radio station covers. The phone player bar cover is a `MediaArtwork`.

## Left: 56 buttons in 32 files

- [ ] Studio editors: `MultitrackTimeline` (8), `TracklistEditor` (3), `ReleasesPanel` (2), `CoverArtGenerator` (2), `ArtistImagePurposePicker` (2), `TrackCreditsEditor`, `StreamOverlayEditor`, `stream-manager/PlaylistDialog`, `go-live/RecordingPanel`, `ImageUploadField`, `imageSlot/*` (2), `BackdropUploadButton`, `EntitySocialHeader` artwork controls (3)
- [ ] Channel Designer: `ChannelLayersMenu` (4), `SavedLooksRow` (2), `VisualizerPickerDialog`, `PlayerVisualizerControls`, `PlayerOverlayControls`, `HeaderStyleTabs`, `BrandAccentSwatches`, `BackdropBackgroundExtras`, `ThemeEditor`
- [ ] Radio booking: `RadioScheduleView` (2), `RadioBookingCalendar` (2)
- [ ] Admin: `AdminArtworkPresetsView` (2), `moderation/tabs/SelectsTab`, `moderation/tabs/RadioSubmissionsTab`
- [ ] Map and docs pages: `MermaidDiagram` (4), `ScreenAtlas`, `FlowGallery`
- [ ] Decide: the drawer scrim in `MobileChrome` is a full-screen `<button>`; a library `Button` does not obviously cover it.

## Notes for whoever continues

- `Button` adds `whitespace-nowrap`, `rounded-md`, `active:scale-95`, `disabled:opacity-50` and, for `variant="text"`, `hover:bg-black/5`. Row-like buttons need `rounded-none` or `hover:bg-transparent`, and a row that is disabled without looking it needs `disabled:opacity-100`.
- `Button` forwards its ref as `HTMLElement`, so a `useRef<HTMLButtonElement>` passed to it must be widened.
- Count again with `grep -rc --include=*.tsx -E '<button\b' packages/tahti-web/src`.
