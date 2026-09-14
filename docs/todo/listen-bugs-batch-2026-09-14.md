# Listen bugs batch (2026-09-14)

**Status:** partial

Five small/medium bugs reported together.

## 1. Radio channels don't reflect playing state — DONE
Fixed in `RadioCategory.tsx`: `RadioBrowserStationRow` now takes `isPlaying`, toggles Play/Pause icon + `aria-pressed`; `playStation` toggles pause/play when the clicked station is already current (matches `CuratedFinnishStationRow` pattern). Both call sites (saved stations, browser search results) pass `isPlaying`.

## 2. Move "add widget" button to top-right, aligned with header — DONE
Both affected buttons now use `ViewShell`'s `actions` slot instead of a manual content row:
- `ListenView.tsx` — `ListenWidgetStoreDialog` (signed-in, `tab === 'listen'`).
- `DiscoverView.tsx` — `DiscoverAddWidgetButton` (`activeTab === 'discover'`).
(Artist/Channel/Collection views have no such button today — nothing to move there.)

## 3. Radio page: upcoming items, drop footer, now-playing support — PARTIAL, needs a decision
- Footer text removed from `RadioView.tsx` (the "Prefer a single artist? Browse the listen directory…" paragraph). Done.
- "Upcoming items" / now-playing: checked `../tahti-org` — `apps/api/src/routes/radio/index.ts:275-389` (`/api/v1/radio/show/:channelSlug`, backing `RadioShowView.tsx`'s Upcoming/Past tabs) is explicitly booking-slot based ("there's no separate Show entity"). **No route or DTO exists for a channel-level now-playing track or a track-level upcoming/queue list** — only Tahti Radio itself (`/radio`, `RadioView.tsx`) has real now-playing + recently-played track data.
- Did not implement further — building a track queue/now-playing UI here would mean inventing a backend shape, which the repo rules say not to do. Needs a call from the user: (a) is "radio page" the per-channel show page (`RadioShowView.tsx`, currently episode/booking schedule only) and the ask is actually a **new backend feature** (channel now-playing + upcoming-track endpoints) to scope into `tahti-org`, or (b) was "only shows live shows" about something else already covered by the existing Upcoming/Past **episode** tabs, and the real ask is just reusing `TrackTable`/`QueuePanel`/`HistoryRow` styling for those tabs (no new data).

## 4. Governance: duplicate header line + confirm Studio-only claim — DONE
Fixed: `AccountPanel.tsx` now passes `<GovernanceView embedded />` (was missing `embedded`, causing both the Settings tab title row and `GovernanceView`'s own `ViewShell` title to render).
Answer to "are all governance pages in Studio?": **No.** Member-facing `/governance*` routes, `/admin/governance*`, `/studio/governance`, and the Settings → Account embed all exist separately.

## 5. Move Channel Designer: Settings → Artist → Channel Designer → Channel & Design — DONE
`ChannelPanel.tsx`'s "Appearance" tab (was a placeholder linking back to Artist) now renders the real `StudioBrandingPanel section="channel-designer" hideSectionNav` designer directly, retitled "Channel Designer". Removed the `channel-designer` tab from `ArtistPanel.tsx`. Updated all hardcoded references: `content/help.ts`, `content/mapScreens.ts`, `views/MoreView.tsx`, `views/studio/StudioBrandingView.tsx` (legacy `/studio/branding?tab=channel-designer` redirect now opens the `channel` settings section instead of `artist`), `components/plugin-store/ThemesCategory.tsx`. Removed the now-dead `channel-designer` member from `ArtistSettingsSection` type / `ARTIST_SECTIONS` list.

## Checks run
`pnpm exec prettier --write`, `type-check`, `lint`, `git diff --check` all clean on every touched file. `GovernanceView.test.tsx` / `prodPathRedirects.test.ts` fail identically on unmodified `master` (jsdom `localStorage` undefined in that suite) — pre-existing, unrelated to this batch, not fixed here.
