# View Catalog

> Auto-generated index of all app views and their Storybook coverage.
> Updated when views change — regenerate by auditing `packages/*/src/views/` against `packages/storybook/src/`.

Legend:
- **Has Story** — view or its key components have Storybook stories
- **Candidate** — components used in this view could be unified into Storybook for shared UI
- **No Story** — no Storybook coverage yet

---

## Desktop Player (`packages/player`)

### Routed Views

| View | Route | File | Storybook | Candidate For |
| --- | --- | --- | --- | --- |
| [Dashboard](#dashboard) | `/dashboard` | `src/views/Dashboard/Dashboard.tsx` | No Story | CardsRow, TopList, CardGrid — all have shared UI stories but not wired for player |
| [Search](#search) | `/search?q=` | `src/views/Search/Search.tsx` | No Story | Tabs, CardGrid, EmptyState |
| [Album Detail](#album-detail) | `/album/$providerId/$albumId` | `src/views/Album/Album.tsx` | No Story | ViewShell, MediaArtwork, TrackTable |
| [Artist Detail](#artist-detail) | `/artist/$providerId/$artistId` | `src/views/Artist/Artist.tsx` | No Story | CardsRow, TopList, MediaArtwork |
| [Favorite Albums](#favorite-albums) | `/favorites/albums` | `src/views/Favorites/FavoriteAlbums.tsx` | No Story | CardGrid, EmptyState |
| [Favorite Artists](#favorite-artists) | `/favorites/artists` | `src/views/Favorites/FavoriteArtists.tsx` | No Story | CardGrid, EmptyState |
| [Favorite Tracks](#favorite-tracks) | `/favorites/tracks` | `src/views/Favorites/FavoriteTracks.tsx` | No Story | TrackTable, EmptyState |
| [Playlists](#playlists) | `/playlists/` | `src/views/Playlists/Playlists.tsx` | No Story | CardGrid, FilterChips, EmptyState |
| [Playlist Detail](#playlist-detail) | `/playlists/$playlistId` | `src/views/PlaylistDetail/PlaylistDetail.tsx` | No Story | TrackTable, ViewShell |
| [Playlist Import](#playlist-import) | `/playlists/import/$providerId` | `src/views/PlaylistImport/PlaylistImport.tsx` | No Story | Input, Button |
| [History](#history) | `/history` | `src/views/History/History.tsx` | No Story | Tabs, CalendarHeatmap, DayOfWeekChart, ListeningClock, TopList |
| [Sources](#sources) | `/sources` | `src/views/Sources/Sources.tsx` | No Story | SettingsPanel, Toggle, Select |

### Settings Modal Views

| View | Modal Tab | File | Storybook | Candidate For |
| --- | --- | --- | --- | --- |
| [Settings](#settings) | General | `src/views/Settings/Settings.tsx` | Has Story | — (covered by SettingsPanel story) |
| [Keyboard Shortcuts](#keyboard-shortcuts) | Shortcuts | `src/views/KeyboardShortcuts/KeyboardShortcuts.tsx` | No Story | KeyCombo |
| [Plugins](#plugins) | Plugins | `src/views/Plugins/Plugins.tsx` | Has Story | PluginItem, PluginStoreItem |
| [Themes](#themes) | Themes | `src/views/Themes/Themes.tsx` | Has Story | ThemeStoreItem |
| [Logs](#logs) | Logs | `src/views/Logs/Logs.tsx` | Has Story | LogViewer |
| [What's New](#whats-new) | What's New | `src/views/WhatsNew/WhatsNew.tsx` | No Story | Timeline components |

### Player Sub-Components (no stories, candidates)

| Component | File | Potential Story |
| --- | --- | --- |
| AlbumHeader | `src/views/Album/components/AlbumHeader.tsx` | MediaArtwork + metadata layout |
| AlbumTrackList | `src/views/Album/components/AlbumTrackList.tsx` | TrackTable wrapper |
| ArtistAlbumsGrid | `src/views/Artist/components/ArtistAlbumsGrid.tsx` | CardGrid wrapper |
| ArtistBioHeader | `src/views/Artist/components/ArtistBioHeader.tsx` | Artist header |
| ArtistPopularTracks | `src/views/Artist/components/ArtistPopularTracks.tsx` | TrackTable subset |
| ArtistSimilarArtists | `src/views/Artist/components/ArtistSimilarArtists.tsx` | CardGrid wrapper |
| DashboardCardsWidget | `src/views/Dashboard/components/DashboardCardsWidget.tsx` | CardsRow wrapper |
| DashboardEmptyState | `src/views/Dashboard/components/DashboardEmptyState.tsx` | EmptyState variant |
| HistoryBody | `src/views/History/components/HistoryBody.tsx` | Tabs + Charts composition |
| HistoryList | `src/views/History/components/HistoryList.tsx` | HistoryDayGroup list |
| HistoryStats | `src/views/History/components/HistoryStats.tsx` | Charts composition |
| PlaylistCardGrid | `src/views/Playlists/components/PlaylistCardGrid.tsx` | CardGrid wrapper |
| PlaylistDetailHeader | `src/views/Playlists/components/PlaylistDetailHeader.tsx` | PageHeader variant |
| SearchEmptyState | `src/views/Search/SearchEmptyState.tsx` | EmptyState variant |
| TimelineEntry | `src/views/WhatsNew/TimelineEntry.tsx` | Changelog timeline |

---

## Tahti Web (`packages/tahti-web`)

### Core Listen / Discovery Views

| View | Route | File | Storybook | Candidate For |
| --- | --- | --- | --- | --- |
| [Listen](#listen) | `/` | `src/views/ListenView.tsx` | No Story | AppShell, CardsRow, GlowMediaTile, SectionTabs |
| [Discover](#discover) | `/discover` | `src/views/DiscoverView.tsx` | Has Story | WidgetCard, WidgetTrackRow, FilterChips |
| [Feed](#feed) | `/feed` | `src/views/FeedView.tsx` | No Story | PageHeader, TrackTable |
| [Favorites](#favorites-web) | `/favorites` | `src/views/FavoritesView.tsx` | Has Story | — |
| [History](#history-web) | (embedded) | `src/views/HistoryView.tsx` | No Story | Tabs, CalendarHeatmap, TopList |
| [Radio](#radio) | `/radio` | `src/views/RadioView.tsx` | No Story | GlowMediaTile, PageHeader |
| [Radio Show](#radio-show) | `/radio/show/$channelSlug` | `src/views/RadioShowView.tsx` | No Story | PageHeader, TrackTable |
| [Schedule](#schedule) | `/schedule` | `src/views/RadioScheduleView.tsx` | No Story | Calendar grid |

### Artist / Channel / Collection Views

| View | Route | File | Storybook | Candidate For |
| --- | --- | --- | --- | --- |
| [Artist Profile](#artist-profile) | `/u/$username` | `src/views/ArtistView.tsx` | No Story | EntitySocialHeader, Tabs, CardGrid, GlowMediaTile |
| [Channel](#channel) | `/channel/$slug` | `src/views/ChannelView.tsx` | Has Story | ChannelBackdropCard, ChannelVisualizer, Tabs |
| [Collection](#collection) | `/u/$username/c/$slug` | `src/views/CollectionView.tsx` | No Story | PlayableTrackTable, PageHeader |
| [Track Detail](#track-detail) | `/t/$id` | `src/views/TrackDetailView.tsx` | No Story | PlayableTrackTable, TimelineReactionBar |
| [Smart Link](#smart-link) | `/r/$slug` | `src/views/SmartLinkView.tsx` | No Story | PlayableTrackTable, PageHeader |
| [Subscribe](#subscribe) | `/subscribe/$username` | `src/views/SubscribeView.tsx` | No Story | Card layout |
| [Green Room](#green-room) | `/u/$username/green-room` | `src/views/GreenRoomView.tsx` | No Story | ConnectedPlayerBar, StemPlayer |
| [Jam](#jam) | `/jam/$code` | `src/views/JamView.tsx` | No Story | TahtiJam components |
| [Chat](#chat) | `/chat` | `src/views/ChatView.tsx` | No Story | ChannelChatPanel |

### Auth / Account Views

| View | Route | File | Storybook | Candidate For |
| --- | --- | --- | --- | --- |
| [Login](#login) | `/login` | `src/views/LoginView.tsx` | No Story | AuthDialog |
| [Join](#join) | `/join` | `src/views/JoinView.tsx` | No Story | AuthDialog |
| [Forgot Password](#forgot-password) | `/forgot-password` | `src/views/ForgotPasswordView.tsx` | No Story | Input, Button |
| [Reset Password](#reset-password) | `/reset-password` | `src/views/ResetPasswordView.tsx` | No Story | Input, Button |
| [Setup Password](#setup-password) | `/setup-password` | `src/views/SetupPasswordView.tsx` | No Story | Input, Button |
| [Verify](#verify) | `/verify` | `src/views/VerifyView.tsx` | No Story | Loader |
| [Signup Payment](#signup-payment) | `/signup/payment` | `src/views/SignupPaymentView.tsx` | No Story | Dialog, Button |
| [Account](#account) | (settings) | `src/views/AccountView.tsx` | No Story | SettingsPanel |
| [Onboarding](#onboarding) | `/onboarding` | `src/views/OnboardingView.tsx` | No Story | Stepper, Input, GenrePicker |

### Library Views

| View | Route | File | Storybook | Candidate For |
| --- | --- | --- | --- | --- |
| [Library](#library) | `/library` | `src/views/LibraryView.tsx` | No Story | Tabs, SectionTabs, CardGrid |
| [My Discography](#my-discography) | (library) | `src/views/MyDiscographyView.tsx` | No Story | PlayableTrackTable, FilterChips |
| [My Collections](#my-collections) | (library) | `src/views/MyCollectionsView.tsx` | No Story | CardGrid, Tabs |
| [Library Embeds](#library-embeds) | (library) | `src/views/LibraryEmbedsView.tsx` | No Story | EmbedTrackRow list |
| [Library Media](#library-media) | (library) | `src/views/LibraryMediaView.tsx` | No Story | ImageLightbox, CardGrid |
| [Library Smart Links](#library-smart-links) | `/library/smartlinks` | `src/views/LibrarySmartLinksView.tsx` | No Story | CardGrid |

### Studio Views (Artist Dashboard)

| View | Route | File | Storybook | Candidate For |
| --- | --- | --- | --- | --- |
| [Studio Home](#studio-home) | `/studio` | `src/views/studio/StudioHomeView.tsx` | No Story | StudioPanel, StatChip |
| [Go Live](#go-live) | `/studio/go-live` | `src/views/studio/StudioGoLiveView.tsx` | Has Story | BroadcastPreflightPanel, StreamManagerPanel |
| [Sounds](#sounds) | `/studio/sounds` | `src/views/studio/StudioSoundsView.tsx` | Has Story | PlayableTrackTable, StashFilesPanel |
| [Sound Detail](#sound-detail) | `/studio/sounds/$id` | `src/views/studio/StudioSoundView.tsx` | No Story | AudioRevisionList, TrackEditDialog |
| [Recordings](#recordings) | `/studio/recordings` | `src/views/studio/StudioRecordingsView.tsx` | No Story | PlayableTrackTable |
| [Releases](#releases) | `/studio/releases` | `src/views/studio/StudioReleasesView.tsx` | No Story | ReleasesPanel, CardGrid |
| [Release Detail](#release-detail) | `/studio/releases/$id` | `src/views/studio/StudioReleaseDetailView.tsx` | No Story | TrackTable, ImageUploadField |
| [Collections](#collections-studio) | `/studio/collections` | `src/views/studio/StudioCollectionsView.tsx` | No Story | CardGrid |
| [Collection Edit](#collection-edit) | `/studio/collections/$slug` | `src/views/studio/StudioCollectionEditView.tsx` | No Story | TrackTable, DragReorder |
| [Upload](#upload) | `/library/upload` | `src/views/studio/StudioUploadView.tsx` | No Story | FilePicker, Progress |
| [Editor List](#editor-list) | `/studio/editor` | `src/views/studio/StudioEditorListView.tsx` | No Story | CardGrid |
| [Editor Project](#editor-project) | `/studio/editor/$id` | `src/views/studio/StudioEditorProjectView.tsx` | No Story | WaveformCanvas |
| [Pro Editor](#pro-editor) | `/studio/sounds/$id/editor` | `src/views/studio/StudioProEditorView.tsx` | No Story | WaveformCanvas |
| [Mastering](#mastering) | `/studio/mastering/$id` | `src/views/studio/StudioMasteringView.tsx` | No Story | WaveformCanvas |
| [Schedule](#schedule-studio) | `/studio/schedule` | `src/views/studio/StudioScheduleView.tsx` | No Story | RadioBookingCalendar |
| [Stats](#stats) | `/studio/stats` | `src/views/studio/StudioStatsView.tsx` | No Story | StatChip, CardsRow |
| [Stats Detail](#stats-detail) | `/studio/stats/detail` | `src/views/studio/StudioStatsDetailView.tsx` | No Story | Charts |
| [Track Insights](#track-insights) | `/studio/insights/$kind/$id` | `src/views/studio/StudioTrackInsightsView.tsx` | Has Story | TrackInsightsPanel |
| [Channel Settings](#channel-settings) | `/studio/channel` | `src/views/studio/StudioChannelView.tsx` | No Story | ChannelDesigner, Input, ImageUploadField |
| [Branding](#branding) | `/studio/branding` | `src/views/studio/StudioBrandingView.tsx` | No Story | ArtistGalleryPanel, ChannelDesigner |
| [Shows](#shows) | `/studio/shows` | `src/views/studio/StudioShowsView.tsx` | No Story | CardGrid |
| [Show Detail](#show-detail) | `/studio/shows/$id` | `src/views/studio/StudioShowDetailView.tsx` | No Story | ShowEpisodeList, Form |
| [Playlists](#playlists-studio) | `/studio/playlists/$slug` | `src/views/studio/StudioPlaylistsView.tsx` | No Story | TrackTable, DragReorder |
| [Updates](#updates) | `/studio/updates` | `src/views/studio/StudioUpdatesView.tsx` | No Story | MentionTextarea |
| [Audience](#audience) | `/studio/audience` | `src/views/studio/StudioRevenueView.tsx` | No Story | FanSubscriptionStats |
| [Stripe](#stripe) | `/studio/stripe` | `src/views/studio/StudioStripeView.tsx` | Has Story | — |
| [Distribution](#distribution) | `/studio/distribution` | `src/views/studio/StudioDistributionView.tsx` | No Story | Form |
| [Governance](#governance-studio) | `/studio/governance` | `src/views/studio/StudioGovernanceView.tsx` | No Story | Tabs, Card layout |
| [Events](#events) | `/studio/events` | `src/views/studio/StudioEventsView.tsx` | No Story | CardGrid |
| [Create Event](#create-event) | `/studio/events/new` | `src/views/studio/StudioEventCreateView.tsx` | No Story | Form, ImageUploadField |
| [Stash](#stash) | `/studio/stash` | `src/views/studio/StudioStashView.tsx` | No Story | StashFilesPanel |

### Governance / Transparency Views

| View | Route | File | Storybook | Candidate For |
| --- | --- | --- | --- | --- |
| [Governance](#governance) | `/governance` | `src/views/GovernanceView.tsx` | No Story | Tabs, Card layout |
| [Feature Requests](#feature-requests) | `/governance/feature-requests` | `src/views/FeatureRequestsView.tsx` | No Story | Card layout, Badge |
| [Governance History](#governance-history) | `/governance/history` | `src/views/PublicGovernanceHistoryView.tsx` | No Story | Card layout |
| [Transparency](#transparency) | `/transparency` | `src/views/TransparencyView.tsx` | No Story | StatChip, CardsRow |
| [Grant Year](#grant-year) | `/transparency/grants/$year` | `src/views/TransparencyGrantYearView.tsx` | No Story | Table |
| [Methodology](#methodology) | `/transparency/methodology` | `src/views/TransparencyMethodologyView.tsx` | No Story | LegalDocShell |

### Help / Legal / Info Views

| View | Route | File | Storybook | Candidate For |
| --- | --- | --- | --- | --- |
| [Help Hub](#help-hub) | `/help` | `src/views/HelpView.tsx` | Has Story | LegalDocShell, Card layout |
| [Legal / About](#legal-about) | `/about`, `/how-it-works`, `/for-artists` | `src/views/LegalView.tsx` | No Story | LegalDocShell |
| [Terms](#terms) | `/terms` | `src/views/TermsView.tsx` | No Story | LegalDocShell |
| [Privacy](#privacy) | `/privacy` | `src/views/PrivacyView.tsx` | No Story | LegalDocShell |
| [AGPL](#agpl) | `/agpl` | `src/views/AgplView.tsx` | No Story | LegalDocShell |
| [Status](#status) | `/status` | `src/views/StatusView.tsx` | No Story | StatChip, Table |
| [News](#news) | `/news` | `src/views/NewsView.tsx` | No Story | NewsWidget |
| [What's New](#whats-new-web) | `/whats-new` | `src/views/WhatsNewView.tsx` | No Story | Timeline components |
| [What Is It](#what-is-it) | `/what-is-it` | `src/views/WhatIsItView.tsx` | No Story | Marketing layout |

### Venues

| View | Route | File | Storybook | Candidate For |
| --- | --- | --- | --- | --- |
| [Venue Register](#venue-register) | `/venues/register` | `src/views/VenueRegisterView.tsx` | No Story | Form, Input |
| [Venue Detail](#venue-detail) | `/v/$slug` | `src/views/VenueDetailView.tsx` | No Story | PageHeader, ImageLightbox |

### Embed Views (no app chrome)

| View | Route | File | Storybook | Candidate For |
| --- | --- | --- | --- | --- |
| [Embed Channel](#embed-channel) | `/embed/c/$slug` | `src/views/EmbedViews.tsx` | No Story | ChannelBackdropCard, ConnectedPlayerBar |
| [Embed Release](#embed-release) | `/embed/r/$id` | `src/views/EmbedViews.tsx` | No Story | GlowMediaTile, PlayableTrackTable |
| [Embed Collection](#embed-collection) | `/embed/col/$slug` | `src/views/EmbedViews.tsx` | No Story | PlayableTrackTable |

### Admin Views (board-only)

| View | Route | File | Storybook | Candidate For |
| --- | --- | --- | --- | --- |
| [Admin Dashboard](#admin-dashboard) | `/admin` | `src/views/admin/AdminDashboardView.tsx` | Has Story | StatChip, CardsRow |
| [Admin Logs](#admin-logs) | `/admin/logs` | `src/views/admin/AdminLogsView.tsx` | Has Story | LogViewer |
| [Admin Users](#admin-users) | `/admin/users` | `src/views/admin/AdminUsersView.tsx` | Has Story | Table, Input |
| [Admin Radio](#admin-radio) | `/admin/radio` | `src/views/admin/AdminRadioView.tsx` | Has Story | RadioStationCover |
| [Admin News](#admin-news) | `/admin/news` | `src/views/admin/AdminNewsView.tsx` | Has Story | Form |
| [Admin Selects](#admin-selects) | `/admin/tahti-selects` | `src/views/admin/AdminSelectsView.tsx` | No Story | CardGrid |
| [Admin Streams](#admin-streams) | `/admin/streams` | `src/views/admin/AdminStreamsView.tsx` | Has Story | StreamManagerPanel |
| [Admin Top Lists](#admin-top-lists) | `/admin/top-lists` | `src/views/admin/AdminTopListsView.tsx` | Has Story | Table |
| [Admin Content](#admin-content) | `/admin/content` | `src/views/admin/AdminContentView.tsx` | No Story | Tabs, Table |
| [Admin Announcements](#admin-announcements) | `/admin/announcements` | `src/views/admin/AdminAnnouncementsView.tsx` | Has Story | Form |
| [Admin Storage](#admin-storage) | `/admin/storage` | `src/views/admin/AdminStorageView.tsx` | Has Story | Table, StatChip |
| [Admin Storage User](#admin-storage-user) | `/admin/storage/$userId` | `src/views/admin/AdminStorageUserView.tsx` | Has Story | Table |
| [Admin Artwork Presets](#admin-artwork-presets) | `/admin/artwork-presets` | `src/views/admin/AdminArtworkPresetsView.tsx` | No Story | ImageUploadField, CardGrid |
| [Admin Financial](#admin-financial) | `/admin/financial` | `src/views/admin/AdminFinancialView.tsx` | Has Story | StatChip, Table |
| [Admin Governance](#admin-governance) | `/admin/governance` | `src/views/admin/AdminGovernanceView.tsx` | Has Story | Tabs, Card layout |
| [Admin Reports](#admin-reports) | `/admin/reports` | `src/views/admin/AdminReportsView.tsx` | No Story | Table, Charts |
| [Admin Grants](#admin-grants) | `/admin/grants` | `src/views/admin/AdminGrantsView.tsx` | Has Story | Table |
| [Admin Grant Cycle](#admin-grant-cycle) | `/admin/grants/$year` | `src/views/admin/AdminGrantCycleView.tsx` | No Story | Table |
| [Admin AGM](#admin-agm) | `/admin/agm` | `src/views/admin/AdminAgmView.tsx` | Has Story | Tabs, Card layout |
| [Admin Vendors](#admin-vendors) | `/admin/vendors` | `src/views/admin/AdminVendorsView.tsx` | Has Story | Table |
| [Admin Map](#admin-map) | `/admin/map` | `src/views/admin/AdminMapView.tsx` | No Story | ListenerWorldMap |
| [Admin Venues](#admin-venues) | `/admin/venues` | `src/views/admin/AdminVenuesView.tsx` | No Story | Table |
| [Admin Add-ons](#admin-addons) | `/admin/addons` | `src/views/admin/AdminAddonsView.tsx` | No Story | DiscoWidgetManagerPanel |
| [Admin Status](#admin-status) | `/admin/status` | `src/views/admin/AdminStatusView.tsx` | Has Story | StatChip, Table |
| [Admin I18n](#admin-i18n) | `/admin/i18n` | `src/views/admin/AdminI18nView.tsx` | Has Story | Table |
| [Admin Moderation](#admin-moderation) | `/admin/moderation` | `src/views/admin/moderation/AdminModerationView.tsx` | Has Story | Tabs |
| [Admin Orphan Pages](#admin-orphan-pages) | `/admin/orphan-pages` | `src/views/admin/orphanPages/AdminOrphanPagesView.tsx` | No Story | Table, Tabs |
| [Admin Missed Shows](#admin-missed-shows) | — | — | Has Story | AdminMissedShowsView |

---

## Summary

| Package | Total Views | Has Story | No Story | Candidates |
| --- | --- | --- | --- | --- |
| `packages/player` | 18 routed + 6 settings + ~30 sub-components | 3 | 21 | 15+ (CardGrid, TrackTable, EmptyState reuse) |
| `packages/tahti-web` core | 17 | 2 | 15 | 8+ (AppShell, PageHeader, GlowMediaTile) |
| `packages/tahti-web` auth | 9 | 0 | 9 | 3 (AuthDialog, Input, Button) |
| `packages/tahti-web` library | 7 | 0 | 7 | 4 (CardGrid, Tabs, TrackTable) |
| `packages/tahti-web` studio | 32 | 4 | 28 | 12+ (StudioPanel, Form, ImageUploadField) |
| `packages/tahti-web` governance | 6 | 0 | 6 | 2 (Tabs, Card layout) |
| `packages/tahti-web` help/legal | 9 | 1 | 8 | 2 (LegalDocShell) |
| `packages/tahti-web` venues | 2 | 0 | 2 | 1 (Form) |
| `packages/tahti-web` embeds | 3 | 0 | 3 | 2 (ConnectedPlayerBar, PlayableTrackTable) |
| `packages/tahti-web` admin | 27 | 18 | 9 | 5 (Table, StatChip) |

### High-Value Unification Candidates

These shared components are used across many views but lack dedicated Storybook stories in the player or web app contexts:

| Component | Used In | Story Status |
| --- | --- | --- |
| **AppShell** | All tahti-web routes | Has story (tahti-web) but not tested with real route content |
| **PageHeader** | Studio, Library, Help, Feed, Collection views | Has story |
| **ConfirmDialog** | Delete actions across Studio, Admin, Settings | No dedicated story |
| **PageStates** (Loading/Empty) | All views | Has story but needs real-view composition tests |
| **StudioPanel** | All Studio sub-views | Has story |
| **SectionTabs** | Studio, Admin navigation | Has story |
| **GlowMediaTile** | Discover, Library, Collection views | Has story |
| **EntitySocialHeader** | Artist, Channel, Collection pages | Has story |
| **CardGrid** (desktop) | Dashboard, Favorites, Playlists, Library | Shared UI story only |
| **TrackTable** (desktop) | Favorites, Playlist, Album, History | Shared UI story only |
| **FilterChips** | Discover, Library, Studio | Shared UI story only |
| **LegalDocShell** | Terms, Privacy, AGPL, About | Has story |
| **InPageNav** | Long-form pages | Has story |
| **EmbedButton** | Channel, Collection, Release | Has story |
| **AudioEngine** | Player playback | Has story (non-visual) |
| **StemPlayer** | Green Room, Pro Editor | Has story |
| **WaveformCanvas** | Editor, Mastering views | Has story |

---

## Regeneration

To update this catalog:
1. Scan `packages/*/src/views/` for new/removed view files
2. Cross-reference with `packages/storybook/src/**/*.stories.tsx`
3. Update Storybook status and candidate flags
4. Regenerate route links from router config (`packages/player/src/routes/`, `packages/tahti-web/src/router.tsx`)
