# Tahti Map screenshot + diagram refresh

**Status:** blocked

## Remaining

signed-in recapture

Recaptured Nuclear atlas PNGs under `packages/tahti-web/public/map/nuclear/`
via `scripts/capture-map-screens.mjs`. Aligned `mapScreens.ts`,
`flowDiagrams.ts`, `NAVIGATION-SITEMAP.md`, and Storybook ScreenAtlas docs
with current chrome.

## Capture mode

Local sibling API (`localhost:3001` / `15011`) was not running. Used the
existing map pipeline against local Vite + `VITE_FORCE_MOCK=1`. Public beta
remains the script default (`MAP_BASE_URL`). Real login against live beta
was not used.

Help article `/help/getting-started` does not exist — capture now uses
`/help/getting-around` plus `/help/keyboard-shortcuts`.

### What recaptured cleanly (rich UI, chrome visible)

Listen, Radio, Discover, Channel, Help hub, Getting around, Keyboard
shortcuts, Status, Transparency, auth/legal/venues, public profile/channel
embeds, Settings modal **Themes** and **Add-ons** (About absent from footer).

### Blocked — signed-in privileged recapture

Signed-in mock auth hit a widespread React “Maximum update depth exceeded”
loop (likely concurrent ViewShell WIP). Crash overlays were **not** kept;
Studio / Admin / member Governance / Library / Messages / Feed / Favorites /
History atlas files were restored from HEAD. Those atlas cards still show
the previous committed shots. `/jam/$code` still pending.

## Flag list

### Component migration candidates

| File | Current | Storybook / shared primitive |
| --- | --- | --- |
| `views/GovernanceView.tsx` | underline `<Link>`s in the header meta | `Button` / `Link` (page itself moved to `ViewShell` in the 3×5 pass) |
| `views/studio/StudioGovernanceView.tsx` | Motions/Topics still local `Tabs` + `StudioPageHeader` in some builds | `ViewShell` + shared `Tabs` (StudioNav already outside) |
| `views/admin/AdminGovernanceView.tsx` / `AdminAgmView.tsx` | `StudioPageHeader` if still present | `ViewShell` |
| `views/studio/StudioSoundsView.tsx` | `window.confirm` delete | app confirm-dialog / `Dialog` |
| `views/settings/SettingsPanels.tsx` | hand-rolled `rounded-full` chips (~line 920) | `FilterChips` or `Badge` |
| `views/ListenView.tsx` | hand-rolled genre / artist-type pills | `FilterChips` (listing already uses them; leftover pills remain) |
| `views/ChannelView.tsx` | hand-rolled rounded pill CTA | `Badge` / `Button` |
| `views/MyDiscographyView.tsx` | hand-rolled uppercase pill | `Badge variant="pill"` |
| `views/TrackDetailView.tsx` | hand-rolled overlay pill | `Badge` |
| `views/ArtistView.tsx` | hand-rolled cover overlay chip | `Badge` |
| `components/ConnectedSettingsModal.tsx` | inline Discord SVG | Lucide or a shared brand-mark helper (same pattern as `SourceServiceIcon`) |

### Broken or stale navigation

| Item | What is wrong |
| --- | --- |
| `/settings/money` | Not a `SettingsSectionId`. `/settings/$section` falls through to Account. `prodPathRedirects.ts` and `cutoverReturns.ts` still emit `/settings/money` for fan-subs. Live section is `/settings/audience`. |
| `/help/getting-started` | Old atlas capture path. Real slugs start at `getting-around`. |
| `/studio/venues` | Atlas `goesTo` pointed here; route redirects to `/admin/venues`. Events should link `/venues`. |
| Messages atlas image | Pointed at `listener-dashboard.png` instead of `messages.png`. |
| `nuclear-board-member` diagram | Claimed Admin was a link-out to Next `apps/web`. Admin is in-app `AdminNav`. |
| Master spine (`nuclear-README`) | Showed Library + `/more` as sidebar items. Desktop sidebar is Listen / Radio / Discover / Favorites / Studio / Admin / Help / Settings. Library is a Studio tab + mobile bottom item. `/more` is diagnostics-only. |

### Illogical IA (not necessarily broken)

| Item | Notes |
| --- | --- |
| Listen label twice | Sidebar **Listen** and the in-page **Listen** tab share a name. Feed / Favorites / History sit under that tab strip; Favorites is also a sidebar item. |
| Member governance | Correctly Settings → Account only — easy to miss. Not a listener sidebar item (intentional). |
| `/venues` | Public directory with no Listen/Radio/Discover chrome item. |
| `/library/smartlinks` | Real Library tab, no submenu or collections-tab inbound. |
| `/studio/distribution` | Releases-row / export-add-on only; no StudioNav item. |
| `/jam/$code` | No in-app chrome entry. Atlas shot still pending (no capture path that can join a live jam). |
| Settings `/settings` route | Renders `null` and opens the modal over empty main. Bookmark works; screenshot shows modal + chrome, not a full page. |
| Admin AGM | Mixes `<Link>` and raw `<a href="/admin/…">` (full reload). |
| Duplicate governance titles | Three contexts all titled “Governance” (member / Studio / Admin). Distinct routes; easy to confuse on the atlas. |
| Help keyboard shortcuts | Article still lists Alt+Feed and My Library. Sidebar is Listen / Radio / Discover / Favorites / Studio. |
| Member `/governance` signed-in | Mock-auth capture hit React “Maximum update depth exceeded”. Crash overlay discarded; previous atlas PNG restored. |
| Signed-in Studio / Admin / Library / Listen tabs | Same update-depth loop during this session’s ViewShell WIP. New crash shots discarded; HEAD PNGs restored. Recapture after the loop is fixed. |
| Settings → Add-ons → Themes | Add-ons category list includes Themes, which duplicates Settings → Themes. |

Persistent chrome: ordinary surfaces keep sidebar + Studio/Admin/Listen tabs.
Full-screen player / Pro Editor / public share canvases correctly omit chrome.

## 2026-09-04 — signed-in recapture after ViewShell 0.0.60

Attempted to replace the stale signed-in atlas PNGs now that ViewShell
`0.0.60` (`124f932cc`) and the follow-on `0.0.61` batch are on the tree.
**Did not overwrite any existing PNGs.**

Local sibling API was up (`localhost:15011`, health `ok`, postgres/redis
up). Seeded login works (`screenshot-artist@e2e.tahti.live` /
`screenshot-board@e2e.tahti.live`), but the session cookie is
`Domain=.tahti.live; Secure`, so localhost Vite cannot keep that session.
Used the existing mock pipeline (`127.0.0.1:5180`, `VITE_FORCE_MOCK=1`)
as the capture script does.

### Still failing — every signed-in chrome surface

Probed with mock auth (`demo@tahti.live` / `isBoard: true`, onboarded):
`/library`, `/listen/feed`, `/listen/favorites`, `/listen/history`,
`/messages`, `/governance`, `/studio`, `/studio/governance`, `/admin`,
`/admin/governance`, `/admin/agm`.

Every route hit the React error overlay. `AppShell` mounts
`RightRailPanel` only when `userId` is set (anonymous public shots stay
fine). No signed-in PNG was written.

**Console / overlay**

```
Warning: The result of getSnapshot should be cached to avoid an infinite loop
    at RightRailPanel (packages/tahti-web/src/components/RightRailPanel.tsx)

Something went wrong! Hide Error
Maximum update depth exceeded. This can happen when a component
repeatedly calls setState inside componentWillUpdate or
componentDidUpdate. React limits the number of nested updates to
prevent infinite loops.
```

**Cause (fixed in 0.0.62):** unstable Zustand selector in
`RightRailPanel` — `s.items.filter(!readAt)` allocated a new array every
snapshot. Now selects `s.items` and filters in the component.

Recapture Library / Feed / Favorites / History / Messages / Studio /
Admin / the three governance contexts on a signed-in session after 0.0.62.

### New flags (do not duplicate the earlier tables)

| Item | What is wrong |
| --- | --- |
| `RightRailPanel` unread selector | Fixed in 0.0.62 — select `s.items`, filter in render. Recapture signed-in atlas shots on a session that includes this fix. |
| Seeded API on localhost | `:15011` is healthy, but `tahti_session` is `Domain=.tahti.live; Secure`. Map capture cannot use seeded artist/board cookies from `127.0.0.1`. |
