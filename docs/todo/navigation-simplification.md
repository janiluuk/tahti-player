# Navigation simplification - Studio, Library, Admin

**Status:** open

Plan only (2026-10-28); nothing implemented yet. Goal: every section fits in **one row of tabs**, pages stay spacious, and everything sits in the context of its section. Long forms never read like a tax return.

Built from a code inventory of `StudioNav.tsx` (`SUBMENUS`, `*_SUBNAV_ITEMS`), `AdminNav.tsx` (`ADMIN_SECTIONS`, `PRIMARY`), `LibraryView.tsx` (`LIBRARY_SECTION_TABS`) and `router/routes-*.tsx` at `64f00ee95`.

## Decided

- **Co-op** becomes its own sidebar item for members; governance leaves Studio (see `docs/DECISIONS.md`, 2026-10-28).

## Open question

- **Favorites** folds into Library as a tab and leaves the sidebar. Decided 2026-10-30: the tab is Favorites at `/library/favorites` (not a rename to Liked). `/favorites` and `/listen/favorites` redirect there. The Studio / Library / Admin regroup below is still open.

## Today

| Section | Tab rows on screen | Top-level items | Main problems |
|---|---|---|---|
| Studio | up to 3 (7 tabs → 23 sub-tabs → in-page tabs) | 7 | Catalog lives in Library; profile/channel settings live in the Settings modal; co-op governance under Studio; Green room ×3, Multicast ×3 |
| Admin | up to 3 (4 sections → 23 pages → in-page tabs) | 23 pages | 7 review queues hidden in Moderation tabs; Dashboard / Status / Monitoring / Logs overlap; Map is a diagnostics page shown as nav |
| Library | up to 2 | 9 (artist) / 5 (listener) | Mostly artist tools; listeners can open Sounds but get "Studio is for artists"; Favorites and History live outside |

## Rules

1. **One tab row per section, at most 6 tabs**, one-word labels. A seventh means regroup, never a "More" menu or a second row.
2. **Second-level choices are never a second tab row.** Use one of:
   - **Toolbar chips or a select** for the same kind of item (Releases / Tracks / Collections, queue types).
   - **One scrolling page with sections** and a sticky side list of section links, for settings.
   - **Hub cards → focused page with a back link** for distinct tools. The section tab stays lit; no new row appears.
3. **Detail pages** (a release, a show, a track) swap the section row for a back link and title, plus at most one row of 4 tabs of their own.
4. **Long forms:**
   - Cards of about 5-7 fields with plain-language headings ("How fans find you", not "Discovery").
   - Essentials first; the rest behind "More options".
   - Each card saves on its own (or autosaves); no single Save at the bottom of a long page.
   - Live preview beside the form on wide screens.
   - Sensible defaults pre-filled.
   - Wizard only for first-time setup: set up channel, new release, first go-live.
5. **One home per thing.** Other places link to it, never embed it again.
6. **Settings modal is account-only:** account, security, notifications, playback, appearance, privacy. Artist and channel settings move to Studio.

## Studio - 6 tabs

`Home · Music · Broadcast · Fans · Stats · Profile`

| Tab | Contents | Moves in from | Second level becomes |
|---|---|---|---|
| **Home** | Status, next steps, upcoming broadcasts, key numbers. Tiles only link. | Overview | none |
| **Music** | Releases, tracks, collections, editor projects. "Upload" and "New release" are primary buttons. | Library: Sounds, Collections, Upload, Embeds, Smart links. Studio: Releases, Distribution, Editor | Toolbar chips `Releases · Tracks · Collections · Projects`; Imported (embeds) is a Tracks filter; smart links and distribution move into the release page |
| **Broadcast** | On/off-air banner with "Go live", one agenda of shows, events and listening parties, 24/7 radio, recordings | Go live, Schedule, Events, Listening parties, Shows, Channel/Radio (24/7, Pinned, Tahti Radio), Library Recordings | Agenda chips `All · Shows · Events · Parties`; Go live is a full-screen flow (check → stream keys → where to stream → green room); 24/7, Recordings, Tahti Radio are hub cards |
| **Fans** | Posts, newsletter, memberships, store, track sales, earnings and payouts, royalty reports | Posts, Newsletter, Audience, Tiers, Stripe, Distribution royalty reports | Hub cards `Posts · Newsletter · Memberships · Store · Earnings` |
| **Stats** | One page with a range picker: overview, plays and listeners, top lists, insights. Per-track insights open from a track. | Stats (4 sub-tabs), Insights, `/studio/stats/detail` | Sections with anchor links |
| **Profile** | Identity, story, people, links, branding, gallery, press kit, release visuals, channel design, address and domain, chat and moderators | Settings modal: Artist (8 panels), Channel & chat (5 panels) | Sectioned page with side links and a live preview; one card per topic, each saving on its own |

**Leaves Studio:** Governance (motions, topics, documents, guide) → sidebar **Co-op**. Selects (editorial rotation) → Admin only; Studio → Channel → Selects has no role check today.

**Detail pages:** Release 7 tabs → 4: `Overview` (details, tracks, artwork, credits) · `Links` (smart links, distribution, export) · `Stats` · `Advanced` (versions, fingerprinting). Show and Track keep 3. The track editor dialog goes 5 tabs → 3: Basics · Sharing · Advanced (audio and export under Advanced).

## Library - 5 tabs, listener-first

`Liked · Playlists · History · Following · Files`

| Tab | Contents | Moves in from |
|---|---|---|
| **Liked** | Liked tracks, releases, sets | Favorites sidebar item (removed) |
| **Playlists** | Playlists you made, saved or collaborate on | Library Collections (listener playlists) |
| **History** | What you've listened to | Listen → History |
| **Following** | Artists and channels you follow | Scattered across profile and feed |
| **Files** | Stash, your media, local files on desktop | Stash, Media, Local files |

Upload, Recordings, Embeds, Smart links and the artist catalog move to Studio. The Overview tab goes (it shows artist storage numbers to listeners); Liked is the default. Artists see the same Library: their catalog is Studio → Music, Library is what they listen to.

## Admin - 6 tabs

`Overview · Inbox · People · Content · Co-op · Platform`

| Tab | Contents | Moves in from | Second level becomes |
|---|---|---|---|
| **Overview** | Health first (status checks incl. live-streams, queues, cron), needs action, key numbers | Dashboard, Status, Monitoring | Sections; "View logs" and "Grafana" are links; Queue health and Cron appear once |
| **Inbox** | Every review queue in one list | Moderation's 7 tabs (support, beta applications, radio submissions, reports, feature requests, missed shows, themes), add-on review | Type chips with counts; the open item in a side panel |
| **People** | Users, roles, membership, per-user storage | Users, Storage → user | Search and filters; user detail in a side panel |
| **Content** | News, announcements, Tahti Selects, top lists, radio (feature, stations, opt-outs, history), venues, artwork presets | Content, News, Announcements, Selects, Top lists, Radio, Venues, Artwork presets | Hub cards → focused pages; Radio's 4 tabs become chips |
| **Co-op** | Board, AGM, grants, annual reports, records, discussions, finances and ledger | Governance (7 tabs), Financial, `/admin/grants/$year` | Hub cards; each grant year is a detail page |
| **Platform** | Add-ons, languages, vendors, storage, logs, monitoring, orphan pages, screen map | Add-ons, Languages, Vendors, Storage, Logs, Monitoring, Orphan pages, Map | Hub cards; Map and orphan pages under a "Diagnostics" card |

## Sidebar after

`Listen · Radio · Discover · Library · Studio · Co-op (members) · Admin (board)`

Favorites leaves (if the open question is a yes); Co-op is new. Mobile bottom bar unchanged; Alt+1-5 keep working. Every moved page keeps its old URL as a redirect.

## Bugs to fix during the regroup

- [x] `/studio/channel` shows an empty body with "Green room" lit for anyone who has a channel (`StudioChannelView.tsx:150-194,248`).
- [x] `?tab=rotation|pinned|tahti-radio` lights "Channel" instead of Radio (`isBroadcastSubnavActive`, `StudioNav.tsx:454`).
- [x] Library → Sounds is visible to listeners but gated by `StudioGate`.
- [x] The editor sidebar doesn't collapse on `/studio/sounds/$id/editor` (`AppShell.tsx:349` regex).
- [x] `/admin/grants/$year` lights no section.
- [x] Double redirect `/studio/channel?tab=design` → `/studio/branding` → `/settings/channel`.
- [ ] `NAVIGATION-SITEMAP.md`, `NAVIGATION-GAPS.md`, `docs/VIEW-CATALOG.md`, `ADMIN_TAB_ONLY_ROUTES` (`AdminNav.tsx:41-53`) and `stores/navigationStructureStore.ts` don't match the code; rewrite them from the new structure.

## Slices (in order)

- [ ] 1. Library 5 tabs + Studio → Music together (the catalog moves in one step); old URLs redirect.
- [ ] 2. Studio Profile: move the Settings modal's Artist and Channel & chat panels; sectioned form with live preview.
- [ ] 3. Studio Broadcast: one agenda; Go live as a full-screen flow; 24/7, Recordings, Tahti Radio as hub cards.
- [ ] 4. Studio Fans and Stats as single pages.
- [ ] 5. Release detail 7 → 4 tabs; track editor dialog 5 → 3 tabs.
- [ ] 6. Co-op sidebar item; governance out of Studio; Selects Admin-only.
- [ ] 7. Admin Inbox (unified queues).
- [ ] 8. Admin Content, Co-op and Platform hubs.
- [ ] 9. Admin Overview merge (Dashboard, Status, Monitoring).
- [ ] 10. Docs and screen atlas rewrite; Storybook surfaces and VIEW-CATALOG in sync.
