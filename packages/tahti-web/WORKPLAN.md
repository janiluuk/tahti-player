# WORKPLAN — tahti-web POC

## Navigation active-state worklist (2026-09-03)

Desktop Listen was unlit on every child route (`/listen/feed`, `/listen/history`, `/channel/*`, …) because the desktop sidebar was a second copy of the nav that never passed `isSelected`. Mobile drawer used the matcher; desktop did not. TanStack `Link to="/"` is exact, so only `/` lit Listen.

- [x] One matcher (`src/lib/navigationActive.ts`) for desktop sidebar, mobile drawer, and mobile bottom bar
- [x] Desktop `AppShell` uses the same `SidebarNavItems` as the drawer
- [x] `SidebarNavigationItem` honors explicit `isSelected` for both paint and `aria-current`
- [x] Listen section tabs follow the path (`activeListenTab`); sidebar Listen stays on for Feed/History, Favorites is the sibling chrome item
- [x] Studio submenu maps archive/stash/playlists/insights/mastering/setup-channel/smartlinks onto existing items (no empty subtab row)
- [x] Admin Map is a real Manage item; unmatched admin routes no longer fake-light Overview

**Flagged, intentional unlit sidebar** (no chrome item on purpose): `/login`, `/join`, `/apply`, `/signup`, `/verify`, password flows, `/onboarding`, `/about`, `/privacy`, `/terms`, `/agpl`, `/what-is-it`, `/how-it-works`, `/for-artists`, `/status`, `/news`, `/whats-new`, `/transparency`, member `/governance`, `/venues`, `/schedule`, `/messages`, `/account`, `/settings`. Settings is a button, not a route. Artist `/u/$username` hides the sidebar.

**Flagged, still no submenu toggle** (Studio section lights, no matching subtab): `/studio/upload` redirects to `/library/upload` (upload is a subtab). `/studio/moderation` and `/studio/venues` redirect away. Do not invent a parent tab for marketing/legal pages.

## Shipped

- [x] **Plugin integration guide and metadata parity** — documented plugin authoring/API checks, add-on types and current state; centralized visualizer metadata and added registry drift coverage ([docs/PLUGIN-INTEGRATIONS.md](docs/PLUGIN-INTEGRATIONS.md))
- [x] **Tahti Map refresh** — added privileged screenshots for recently ported Studio/Admin/Settings views and documented each screen’s actions and destinations with per-view Mermaid navigation diagrams ([UI-REDESIGN-WORKLOG.md](UI-REDESIGN-WORKLOG.md))
- [x] **Beta feature-port consolidation** — Radio announcements/pinned announcements, Tahti Radio submissions, Clips, archive/Sounds parity, HEARTHIS shared playback, rotation drag-and-drop/capacity handling, notification parity, track statistics modal, and the latest admin/studio audit documentation ([UI-REDESIGN-WORKLOG.md](UI-REDESIGN-WORKLOG.md))
- [x] Sparse sidebar + Studio/Sources/Library/Channel tabs
- [x] Sources **CardGrid** big service icon tiles + detail pane
- [x] **Settings** Nuclear-style (Themes under Settings; Account demoted)
- [x] Go Live, catalog, upload, schedule, stats
- [x] Profile-integrated channel designer (owner Design tab)
- [x] Studio Channel design / profile / domain
- [x] **Inline channel page design** — `/channel/$slug?edit=1`: presets, side Layers (hide/add), drag reorder; layout localStorage; Look via API
- [x] Editor EQ/comp/limiter + markers + stems
- [x] Newsletter send, DMs, releases, revenue, governance
- [x] **Offline mock session** — auth `/me`, follow set, fan subscribe activate, Sources Connect, Stripe Connect in-app ([MOCKS.md](MOCKS.md))
- [x] **Port checklist** — [FEATURES.md](FEATURES.md)
- [x] **Demock wave 1** — prod builds skip silent mock fallback (`api/mode.ts`); chat WS → `wss://chat.tahti.live`
- [x] **Demock waves 2–3** — Go Live / broadcast + upload/archive live paths (see FEATURES.md)
- [x] **Demock waves 4–5** — fan subscribe + Connect; DMs + governance (see FEATURES.md)

## Product priority

- [x] **Album-based designer** — `/studio/collections`
- [x] **Add-to-playlist** — player bar, Music, tables
- [x] **Visualizations** — ChannelView + analyser
- [x] **Broadcasting wizard** — Connect → Live → Multistream
- [x] **Email verify** — `/verify`
- [x] **Fan-tier editor** — Settings → Money
- [x] **Screen atlas on `/more`** — curated e2e thumbnails + Nuclear routes (`public/map/`, `ScreenAtlas`)

## Checklist (remaining)

Kept in sync with [FEATURES.md](FEATURES.md)'s "Remaining / partial" list, which has the up-to-date detail — this is the short version.

- [x] Full Three.js visualizer presets (ten distinct analyser-reactive scenes, lazy-loaded in the channel hero and ambient page background)
- [x] Stash share access (grant expiring read/download access + revoke)
- [x] Sources OAuth callback-return verification (SoundCloud, Bandcamp, Google Drive, and Mixcloud production redirect shapes land on the matching source result in the SPA)
- [x] Radio slots depth — weekly Tahti Radio and own-channel filters, two-hour selection, show type/notes, green-room links, cancellation, and mobile-safe horizontal schedule grid are implemented.
- [x] **Channel moderator management** — `/studio/moderation` is exposed from Studio Manage, with owner-gated assignment/removal, chat-ban UI, and mock/API coverage for the delegated moderator contract.
- [x] Multitrack timeline + press-kit polish — press-kit gallery and download flows are shipped; editor projects now have a typed, autosaved multitrack timeline with synchronized preview and responsive controls.
- [ ] Production cutover for `apps/web` — complete the listener/artist/admin no-drop ledger in [GAP-MAPPING.md](GAP-MAPPING.md) before changing the official client; keep Next Admin canonical unless the Admin parity gate is explicitly closed.
- [ ] **Fan-sub vs track purchase (same original file)** — Playwright `e2e/fan-sub-and-track-purchase.spec.ts` (mock Vite). Contract: subscriber download and a separate track purchase both yield the uploaded original (`riff.wav`), the artist sees those two orders, and the board audit log records them. Progress 2026-09-03: mock uploads are listener-visible when public; download uses the original blob + `download` filename; live download asks `?format=source` then the default gate; top-bar vs Studio Upload names no longer collide; `e2e/helpers/mockStripe.ts` can inject payout/audit rows for the spec. Remaining:

  - [ ] **À la carte track purchase does not exist.** The public track page has Download, not Buy. “Paid download” in `../tahti/docs/engagement-and-fansubs.md` means a *fan-subscriber* downloading (5× grant weight), not a second product. There is no second order type for the artist board.
  - [x] **Mock original download + filename.** Mock uploads register in `mock-uploads.ts`; `/t/:id` reconstructs them; download uses the object URL and a `download` attribute. Live `fetchPublicArchiveDownload` tries `format=source` then the ungated URL. Engagement still documents Opus/MP3 vs original/FLAC; sibling API FLAC remains `?format=flac` for non-FREE artists.
  - [x] **Mock uploads visible when public.** `uploadSoundFile` still mints `arch-mock-*` ids; `mockTrackDetailFromUpload` serves them on `/t/:id` after visibility is not PRIVATE.
  - [ ] **Subscribe does not create a product order or audit row.** Mock activate is in-session only. Studio → Audience `mergeRevenueOrders()` lists static fan-sub payouts + Revelator royalties. The e2e helper can overlay rows for Playwright; production/mock product paths do not. `FAN_SUBSCRIPTION_CREATE` in Admin → Logs is still a canned DJ Kaski line without the helper.
  - [ ] **Artist cannot see the board audit log without a board session.** `/admin/logs` is board-gated; `/me` overwrites a localStorage `isBoard` patch unless `VITE_MOCK_ADMIN=1`. The e2e helper can grant board on `/api/auth/me` for the spec only. `LEDGER_ENTRY_CREATE` now has a human line in `AdminActivityView`.
  - [x] **Upload button name collision.** Top bar is “Open upload”; Studio Upload submit is “Upload file”.
  - [x] **Fixture path.** Spec looks in `~/Downloads/riff.wav`, `~/Music/riff.wav`, then `TAHTI_E2E_RIFF_WAV`.

- [x] Move Help center and Settings to the bottom of the sidebar (`SectionSidebar`/`SidebarNavigation`), separated from the main nav groups above.
- [x] Any widget with a play icon (Listen widgets, disco-widgets, etc.) should reflect the shared player's actual state — highlighted/active whenever its track is the one currently playing, not just a static icon. **Discover widget track rows** now toggle play/pause, ring the artwork, and highlight the row when current; radio widget tiles were already done in an earlier round.
- [x] **Settings / Branding / Radio IA (first slice)** — Gallery and Channel Designer live only under Studio → Branding; multicast is a Radio subtab; Settings no longer embeds those duplicates.
- [x] Artist-page Channel Designer element list (releases, tracks, latest, feed, news, player, backdrop) and the remaining look-only editor.
- [x] Library as a Studio tab — `/library*` stays, Studio stays selected, mobile bottom nav still has Library.
- [x] **Artist order management** — Studio → Audience (`/studio/revenue`) matches production `/dashboard/revenue` for stats, merged payout history (fan-subs + Revelator royalties), Connect warning, empty tier state, order-flow breakdown, and help tour. Contracts: sibling `GET /api/me/fan-sub-payouts`, `GET /api/me/revelator/royalties`, `GET /api/me/fan-tiers`, `GET /api/me/fan-subs/connect`, money-flow in `../tahti/docs/engagement-and-fansubs.md`.

Done since last update (was listed here as remaining, verified shipped): channel chat hardening (hCaptcha + rail parity), Stash upload UI, Stats detail page, Venue register, Membership purchase, Password/account security (TOTP panel), board admin (22/22 pages, now `partial` not `out-of-scope`).

## Storybook UI compliance backlog

This backlog comes from the Storybook comparison audit. Prefer the original Nuclear primitives from `@tahti-player/ui` wherever they cover the need. Admin-specific Storybook entries are secondary references: keep board workflows dense where necessary, but match the shared Nuclear chrome, controls, states, and spacing first.

### High priority

- [x] Update stale Storybook stories after the navigation redesign: remove the deleted `AppTopNav` `minimal` variant stories and replace the removed Studio tools-panel story with the six-section Studio navigation states.
- [x] Add Storybook coverage for `SectionSidebar`, including active, inactive, no-current-route, deep-route, mobile overflow, and representative Studio/Admin variants.
- [x] `SectionSidebar` now wraps Nuclear's existing `SidebarNavigation` and `SidebarNavigationItem`; explicit route selection is retained for beta deep/query routes.
- [x] Normalize remaining custom page headers against `PageHeader` / `StudioPageHeader`: Collection, Track detail, Studio home, Studio archive detail, More/map, and any later raw `<h1>` findings.

### Plugin integration follow-up

- [x] **Authoring and parity baseline** — added the agent-facing plugin contract, typed add-on settings, explicit sibling-API counterpart metadata, and a runnable example plugin/tutorial. The remaining items below are the implementation backlog, not unverified claims of runtime support.
- [x] **Bandcamp catalog import API** — complete the sibling API's Bandcamp album listing and import endpoint; the beta add-on UI, OAuth connection, release shop-link editor, and Bandcamp brand actions are now wired to those contracts.
- [ ] **Nuclear registry runtime parity** — the remaining Nuclear registry entries are now visible in Add-ons with plugin-owned configuration forms and explicit available/partial/planned status; implement provider runtime/API contracts for the planned entries before marking them active. The shared source capability contract, YouTube Liked Songs parser/configuration, and Multicast destination configuration are now explicit, but they do not claim runtime parity for planned providers. `youtube-playlists` and `soundcloud-dashboard` have since graduated from `planned` to `partial`: both are covered honestly by existing Listen-widget embeds (YouTube playlist embed, SoundCloud profile-feed embed), not by a new backend contract — `bandcamp-dashboard`, `deezer-dashboard`, `listenbrainz-dashboard`, `omnisource`, and `youtube-liked-songs-sync` remain genuinely backend-blocked.
- [x] **Slice 4 — generic Audio FX chain host** — extracted add/remove/reorder operations and plugin-owned parameter metadata/controls from `StudioProEditorView`, with chain regression coverage.
- [x] **Slice 5 — shared multicast destination form** — share the destination form between Go Live and Settings, keeping provider-specific credentials inside each provider configuration.
- [ ] Define and implement an `ExportProvider` only after `../tahti` exposes submit/status/webhook contracts; the current registry is metadata/deep-link only.
- [x] **Slice 6 — source capability contracts** — split Sources into OAuth, search, and link/tool adapter contracts and route the Add-ons Import host (ex-`SourcesView`) plus Studio Upload through them without losing provider-specific behavior. Sibling `GET /api/me/import-plugins` now lists the same catalog.
- [ ] Define the credential/permission lifecycle for a real integrations marketplace before implementing it.

### Medium priority

- [x] Replace hand-styled native controls in listener and Studio surfaces with Storybook-backed Nuclear components where behavior permits: `Input`, `Select`, and `Textarea` in `ChannelRadioPlaylistPanel`, `RadioBookingCalendar`, `StreamManagerPanel`, `StudioEditorListView`, `StudioDistributionView`, `StudioReleasesView` — re-verified 2026-09-02, all six files now have no native form controls left. Follow-up 2026-09-03: `StashFilesPanel`, `AdminI18nView`, `AdminAnnouncementsView`, and `AdminAgmView` now use `Input`/`Select`/`FilePicker`/`Toggle`; remaining Studio checkboxes in shows, playlists, branding, and add-to-playlist are `Toggle`. Channel designer, visualizer/add-on settings, disco-widget enable, newsletter fans-only, and admin association-member are `Toggle`. Still open: `ArtistGalleryPanel` and `StudioBrandingView` avatar keep hidden file inputs (media-upload click-on-preview, not a dropzone — intentional under the media-upload convention). Follow-up 2026-09-03 (0.0.41): `AdminStreamManagerPanel` refresh, `WidgetTrackRow` play, and `ChannelView` stream play use `Loader`; `ApiTokensPanel` write-access, `StudioRadioSubmissionPanel` track picks, and `PluginStorePanel` Spotify/HearThis import row selection use `Toggle`.
- [x] Replace the native control in the Nuclear add-on configuration surface with the shared `Select`; the remaining listener/Studio form audit is still open.
- [ ] **Full Studio/Admin UX sweep (2026-09-03)** — audited all 34 Studio views + 27 Admin views + moderation/orphanPages subtabs (~68 files) against the design system; full file:line findings in [STUDIO-ADMIN-UX-SWEEP.md](STUDIO-ADMIN-UX-SWEEP.md). Not yet fixed — this is the checklist the four bullets below now track counts against:
  - [ ] ~70 real action buttons (save/delete/approve/reject/publish/add/edit) with no paired lucide icon — heaviest in Admin moderation tabs (`BetaTab`, `ContentReportsTab`, `FeatureRequestsTab`, `RadioSubmissionsTab`, `SupportTab`) and `AdminRadioView` (8 in one file), also present across ~15 Studio views. Mechanical once an icon is picked per action.
  - [ ] ~15 static explanatory paragraphs sitting permanently in the page body (not data, not validation errors) that should move behind the existing `Tooltip` "?" badge pattern (`ChannelDesigner.tsx`'s "About this preview" badge is the reference implementation) — no shared component gap here, just needs doing.
  - [ ] ~12 instances of tab/segmented-control drift across **four different implementations** with no canonical choice (`Tabs`, `Button variant="text" role="tab"`, raw styled `<Link role="tab">`, raw `<button>` chip-groups) — `StudioStatsView`/`StudioStatsDetailView` duplicate the same range-picker verbatim, `StudioStatsView` alone has 4 different hand-rolled groups. No existing `SegmentedControl`/button-group `Toggle` component covers the chip-group case; may need a new component in `@tahti-player/ui`, not just a swap.
  - [ ] Two small missing primitives surfaced repeatedly with nothing to swap to: a shared inline **Alert/Banner** (hand-rolled in `AdminLogsView`, `StudioRevenueView`, `StudioSoundView`) and the **SegmentedControl** above.
- [ ] Replace repeated bespoke bordered panels with `Box`, `SectionShell`, `Card`, `CardGrid`, or `StudioPanel` where the content is a standard panel/card/list rather than a deliberately custom visualization or editor. 2026-09-03 sweep found ~15 more instances (at least 5 distinct copy-pasted variants of `StudioPanel`'s own recipe with the opacity/radius/padding numbers drifted apart) — see STUDIO-ADMIN-UX-SWEEP.md; `AdminGrantCycleView` mixes `SectionShell` and `StudioPanel` on the same page and needs a decision, not just a className swap.
- [ ] Audit custom actions against Nuclear `Button`, `FavoriteButton`, `MediaIconActions`, `CopyButton`, and `SaveButton`; prioritize Artist gallery actions, channel layer actions, collection actions, and Radio actions while preserving legitimate custom tab, drag-handle, and row-selection buttons. Progress 2026-09-03 (0.0.43): collection track favorite and AGM/MusicBrainz copy now use `FavoriteButton` / `CopyButton`. See the missing-icon count above for the much larger remaining scope found in the full sweep.
- [ ] Normalize remaining loading, empty, error, and status treatments against `PageLoading`, `PageEmpty`, `EmptyState`, `Loader`, and `Badge`. Progress 2026-09-03 (0.0.43): stash / channel chat / add-to-playlist empty copy use `EmptyState`. 2026-09-03 sweep found ~20 more instances, almost entirely in Admin (`AdminMissedShowsView`, `AdminNewsView`, `AdminRadioView` ×4, `AdminReportsView`, `AdminStatusView`, `AdminStorageUserView`, `AdminStorageView` ×5, `AdminTopListsView`, `AdminUsersView`, `AdminVenuesView`) plus several Studio views — every one of these files already uses `PageLoading` correctly for the loading state but hand-rolls empty/error as a bare `<p>` instead of `PageEmpty`/`PageError`.
- [ ] **New: consolidate `toast` vs. a local `msg` state rendered as a raw `<p>`** for the same transient-feedback purpose — 2026-09-03 sweep found ~10 instances, several inside files (`StudioDistributionView`, `StudioGoLiveView`, `StudioModerationView`) that already call `toast.success`/`toast.error` correctly elsewhere on the same page. Consolidate on `toast`.
- [x] **SaveButton sweep (first pass):** persist-edit controls use Storybook `SaveButton`. Create/publish stay `Button`. Studio Sound icon-only toolbar flagged and left. Disabled story added. Remaining: none on the original persist list except Sound toolbar.
- [ ] **StatChip sweep:** artist/channel follower rows and Studio home summary counts use `StatChip`. Remaining: Studio stats overview, channel/schedule day cards, track insights, fan-sub stats, admin dashboard/content KPIs, stream manager cells, optional admin user followers and storage.
- [x] **System rule — URL-field copy convention:** every field that displays a URL (a share link, smartlink, RTMP server URL, embed src, etc.) must show it in a visible `<code>`/text field and pair it with `@tahti-player/ui`'s `CopyButton` inline — never a bare copy-icon button with no visible URL, and never a hand-rolled copy handler when `CopyButton` already does it. Established as the pattern in `ChannelShareButton.tsx`/`EmbedButton.tsx`; applied to `SoundShareLinksSection.tsx` (2026-09-02). Swept and fixed (2026-09-02): `StudioReleasesView.tsx`'s "Copy smartlink" now shows the `/r/:slug` path inline and uses `CopyButton`; `StudioGoLiveView.tsx`'s `CopyField` now delegates to `CopyButton` instead of hand-rolling the same check-icon swap. `ApiTokensPanel.tsx`, `StudioDistributionView.tsx`, and `AdminAgmView.tsx` still call `navigator.clipboard.writeText` directly but copy a token/text block, not a URL — confirmed out of scope for this rule, left as-is. Rule stays standing for any new URL-displaying field.
- [ ] **System rule — set-image hover delete + preview modal:** every upload widget that already has an image (avatars, backdrops, covers, logos, slideshow frames) must on hover show a corner **X** that deletes with confirm, and open a modal with a large preview (slideshow strip below when multi-image) from which the user can change or delete. Empty slots keep placeholder + click-to-upload. Spec: [docs/todo/image-upload-hover-lightbox.md](../../docs/todo/image-upload-hover-lightbox.md).
- [x] **System rule — media upload convention:** every avatar/backdrop/image/video upload surface must (1) render a ready placeholder (avatar icon or backdrop placeholder), never a bare "choose a file" prompt with nothing shown first; (2) if more than one image can be attached, the placeholder/existing image is hover-affordanced to open an upload widget (gallery-style), otherwise (exactly one file expected) clicking opens the upload dialog directly, no intermediate widget; (3) never accept a pasted URL/link as a substitute for uploading a file; (4) always confirm the upload's result with a toast and refresh the on-page preview immediately, not on next reload; (5) for video, show a progress bar while server-side processing is required, not just during the upload transfer; (6) uploaded content is stored to R2 under the uploading user's own namespace by default. Established pattern already exists in some surfaces (`RoundImageUploadButton.tsx`, `BackdropUploadButton.tsx`, `ImageUploadField.tsx`) — sweep every other image/video upload entry point in Studio/Admin/Settings against this list and fix or flag what doesn't comply. **Swept 2026-09-03:** fixed missing toast confirmation (point 4) in `ArtistGalleryPanel.tsx` (both the main panel and `ArtistGalleryAddIcon`), `StreamOverlayEditor.tsx` (also added the missing cover-image preview, point 1), `OnboardingView.tsx`'s avatar upload, `StudioReleaseDetailView.tsx`'s artwork upload, `StashFilesPanel.tsx`'s file upload, and — highest-leverage — the shared `ImageUploadField.tsx` itself (previously silent on success/error; this fix propagates to its 6 consumers: `ShowImagePicker.tsx`, `VenueRegisterView.tsx`, `StudioScheduleView.tsx`, `StudioVenuesView.tsx`, `AdminDiscoWidgetsView.tsx`, `AdminNewsView.tsx`). Confirmed already compliant, no changes needed: `ChannelDesigner.tsx`, `StudioBrandingView.tsx`, `StudioCollectionEditView.tsx` (all three already use toast + immediate preview refresh correctly). Confirmed out of scope (not image/video media): `TracklistEditor.tsx` (playlist file import), `AdminI18nView.tsx` (CSV import), `ChannelLayersMenu.tsx`/`ChannelRotationEditor.tsx`/`ChannelView.tsx` (drag-reorder `onDrop`, not file upload), `StudioProEditorView.tsx` (plugin-chain reorder). **Flagged, not fixed** — needs a product decision, not a mechanical fix: `ChannelDesigner.tsx`'s header/player backdrop picker has a "YouTube, video, or image URL" text field (`videoUrlInput`, toggled via `videoUrlToggle`) that lets an artist paste an external image/video URL as an alternative to uploading a file, which violates point 3 as written for the non-YouTube case (the YouTube-embed case is a legitimate distinct feature, not a media upload); recommend either splitting the field to YouTube-only or confirming external-CDN backdrops are an intentional exception. **Flagged, backend gap:** point 5's video-processing progress bar doesn't apply anywhere in this sweep — no upload endpoint in the current API contract (`uploadChannelHeaderVideo`, `uploadStashFile`, `uploadSoundFile`) models a server-side processing/job-status step to show progress against; `UploadTrackDialog.tsx`'s "processing may take a minute" note is the closest existing treatment. Typecheck and `pnpm test` clean after all fixes.

### Storybook quality and verification

- [x] Add Storybook states for Studio deep routes, Admin nested/moderation routes, artist-page standard top navigation, mobile navigation, and active/inactive navigation states.
- [x] Add a dedicated Storybook TypeScript check after updating legacy stories for required label props and adding the Vite/global declarations needed by imported `tahti-web` files.
- [x] Run the Storybook render build for the current compliance batch and record intentional exceptions, especially for Admin operational tables, specialized editor controls, and legacy story prop contracts.

### Community metadata follow-up

- [ ] Extend the sibling archive metadata API to record mentions from archive descriptions and return source title/link context in the public mentions response; then remove the artist-page fallback link and verify notification delivery end to end.

### Nuclear component reference order

When replacing a bespoke element, check these existing Storybook components first: `SidebarNavigation`, `TopBar`, `Button`, `Box`, `SectionShell`, `Card`, `CardGrid`, `StudioPanel`, `Tabs`, `Tooltip`, `Input`, `Select`, `Textarea`, `Dialog`, `SaveButton`, `StatChip`, `FavoriteButton`, `FilterChips`, `Pagination`, `PageLoading`/`PageEmpty`/`PageError`, `EmptyState`, `Loader`, `TrackTable`, `MediaArtwork`, and `Badge`. No shared segmented-control/button-group `Toggle` or inline `Alert`/`Banner` component exists yet — see the 2026-09-03 sweep bullets above before building a one-off.

## Verify

```bash
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && nvm use 24
pnpm --filter @tahti-player/tahti-web type-check
pnpm --filter @tahti-player/tahti-web build
# Offline:
VITE_FORCE_MOCK=1 pnpm --filter @tahti-player/tahti-web dev
# Live API (no silent mock in prod build):
unset VITE_FORCE_MOCK && pnpm --filter @tahti-player/tahti-web dev
```
