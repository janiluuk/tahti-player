# UX batch: 50 slices (2026-11-09)

**Status:** partial

Fifty small UI/UX slices. Part A comes from open todos (items that need no product call); part B from a fresh walk-through of the mock app (desktop 1280 and iPhone 13). Ship in PRs of about ten; tick here, fold into HISTORY and delete this file when done. Library components only (`@tahti-player/ui`), a Storybook story for any new surface.

## A. From open todos

Empty-state CTAs ([empty-state-create-ctas.md](empty-state-create-ctas.md)):

- [x] A1. `views/studio/collection-edit/TracklistPanel.tsx` - "No tracks yet" gets an Add tracks action (scroll to the import panels when editing, else switch to edit).
- [x] A2. `views/studio/StudioReleaseDetailView.tsx` fingerprint "no audio" empty - Upload audio action (open the track that needs audio).
- [x] A3. `components/channel-view/RadioProgrammingGrid.tsx` empty programme - Book a show action (`CalendarPlus`, same path as the Radio booking calendar).
- [x] A4. `components/ListenAddonsPanel.tsx` / `DiscoWidgetManagerPanel.tsx` empty - Browse add-ons action (`Puzzle`).
- [x] A5. `views/admin/streams/ChannelTracksPanel.tsx` "channel has no tracks" - Message the artist / open their Studio upload link (`Upload`).
- [x] A6. Discussion topic, track and channel comment empties - "Be the first to reply/comment" focuses the composer.
- [x] A7. `views/admin/moderation/tabs/ThemesTab.tsx` empty catalog - link to the theme submission docs (`Palette`).

Discover / Listen audit ([discover-listen-widget-audit-2026-11-05.md](discover-listen-widget-audit-2026-11-05.md)):

- [x] A8. Listen section pills: colour by meaning (live = green, radio = cyan, history = yellow, news = yellow, releases = purple), not six arbitrary colours; drop pills that only repeat the title.
- [x] A9. "New tracks" on Listen: same header and row frame as the other sections (no left accent bar, no extra panel).
- [x] A10. Listen customise controls: label the reorder and add icon buttons (tooltip + visible text on desktop) to match Discover's widget controls.
- [x] A11. Discover masonry: Latest releases / Public playlists with one item collapse to their content height (no 280px box, no blank area above Random track).
- [x] A12. Discover tab cards: Groups and Venues cards use the same card frame as Artists.
- [x] A13. Filters: one filter-field pattern on Listen sections (desktop and phone alike).

Governance ([governance-page-polish.md](governance-page-polish.md)):

- [x] A14. Co-op page back link only when opened from What is Tahti.
- [x] A15. Governance uses the full content width like Admin.
- [ ] A16. Governance status colours and accent icons for motions, elections and stat tiles.

Help ([help-pages-finnish-redesign.md](help-pages-finnish-redesign.md)):

- [x] A17. Add-ons help table rows (`content/pluginHelpCatalog.ts`) in Finnish.

Feed:

- [x] A18. Community stories and Your feed on phones: the `StoryRow` header controls wrap under the title instead of squeezing it.
- [x] A19. `FeedStoryDialog`: Newer / Older keyboard arrows (←/→) like the full-screen player.
- [x] A20. Feed empty state ("not following anyone") shows the Latest News row below it when sources exist (today it renders only when items exist - verify).

## B. From the walk-through

- [x] B1. Venues tab: the first venue thumbnail fills the panel and hides the list. `components/VenuesDirectory.tsx` - make the thumbnail Link `relative`.
- [x] B2. Studio Stats opens scrolled past its title and tabs. `views/studio/StudioStatsView.tsx` - `scrollIntoView` only when the user picked a section.
- [x] B3. History shows "Nothing to show yet" under real cross-device stats. `views/HistoryView.tsx`, `components/history/HistoryStatsSection.tsx` - hide or reword the local empty state when `AcrossDevicesPanel` has data.
- [x] B4. Input with start/end addon: width classes land on the inner input, so the frame and field differ. `ui/Input.tsx` - put width classes on the wrapper when an addon is set (Help search, Sounds filter).
- [x] B5. Artists search squashed to ~24px (same root cause as B4). `components/DirectoryArtistsBrowser.tsx`.
- [x] B6. Full-screen player time labels unreadable on the visualizer. `components/FullScreenPlayer.tsx` / seek bar - chip background, player-bar size.
- [x] B7. Artist grid clips the last card on desktop and shows one half-width column on phone. `ui/CardGrid`, `components/DirectoryArtistCardGrid.tsx` - cards `w-full` in the track.
- [x] B8. Unread dots cover the avatar initial. `components/app-top-nav/UserMenu.tsx` - one small corner dot outside the initial.
- [x] B9. Queue count badge covers the queue icon. `components/ConnectedPlayerBar.tsx` - offset the badge.
- [x] B10. Tab strips cut labels with no scroll hint (phone Library/Discover/Studio, desktop Collections). `components/SectionTabs.tsx` - edge fade + scroll active tab into view with padding.
- [x] B11. "Your next broadcasts" grid leaves a solid grey cell. `views/studio/schedule/ScheduledTimes.tsx` - gap-based cards.
- [x] B12. Radio banner shows the slug ("Open northern-lights"). `views/RadioView.tsx` - channel display name.
- [x] B13. Featured-live card shows a "TR" tile for another channel. `views/RadioView.tsx` - live channel artwork via `MediaArtwork`.
- [x] B14. Hour-long durations shown as minutes ("62:00"). `components/ChannelRotationEditor.tsx`, `views/studio/home/RecentActivitySection.tsx` - shared duration formatter with hours.
- [x] B15. "(1 likes)" in the like button label. `components/AmbientTrackRow.tsx` - plural-aware key.
- [x] B16. Settings nav label touches the border ("Playback & language"). `ui/SettingsPanel/SettingsPanelNav.tsx` - wider nav or truncate.
- [x] B17. Channel now-playing title cut to "Aurora …" on phone. `components/channel-view/ChannelStagePlayer.tsx` - two lines.
- [x] B18. Blank artwork tile next to Now Playing on the channel page. Same files - `MediaArtwork` with seed / channel avatar fallback.
- [x] B19. Artist stat pills stack one per row on phone. `components/EntitySocialHeader.tsx` - wrap full width under the avatar.
- [x] B20. "Import sources" heading glued to the upload panel. `views/studio/StudioUploadView.tsx`, `upload/UploadSourceWidgets.tsx` - spacing.
- [x] B21. Fans page chat toggles left of labels vs right elsewhere. `components/moderation/ChatAccessPanel.tsx` - use `SettingsToggle`.
- [x] B22. Page intro subtitles render as bold headlines (Fans, Profile). `ui/ViewShell.tsx` - subtitle as small secondary paragraph.
- [x] B23. Cassette placeholders instead of artwork in Library Top sounds and History Top lists. `views/LibraryView.tsx`, `components/history/AcrossDevicesPanel.tsx` - `MediaArtwork` with seed.
- [x] B24. Favorites channel cards show bare slugs. `views/FavoritesView.tsx` - `@username` like Following.
- [x] B25. Rotation copy "switches playback to In order." - reword the `reorderingSwitchesPlaybackToIn` string (en + fi).
- [x] B26. Media page intro mentions "Cloudflare R2". Reword `mediaDescription` to "your Tahti media library" (en + fi).
- [x] B27. News page has four different left edges and a floating sparkle icon. `views/NewsView.tsx` - one column, icon in the meta row.
- [x] B28. Repeated headings: Library "Overview" + "Library overview" card, Recordings + "Recordings (2)" in a narrow box. `views/LibraryView.tsx`, `views/studio/StudioRecordingsView.tsx`.
- [ ] B29. Stream Manager edit pencil alone on its own row on phone; "Offline" indented on desktop. `components/stream-manager/PanelHeader.tsx`.
- [x] B30. "Show all news" button shadow clipped on phone Discover. `views/DiscoverView.tsx` / From Tahti header - `pr-1` / `min-w-0`.

Not taken from the audit: `d.m.yyyy` dates in English (deliberate one date style, see `date-format-sweep.md`); Discover 3-column widths and the phone Radio hero (layout redesigns, not slices); a duplicated "3 sounds" heading (not confirmed in code). Console CORS errors on real station streams (Yle, Radio Helsinki, Nova) belong with [radio-nova-nrj-playback.md](radio-nova-nrj-playback.md).
