# Navigation logic gaps — found while building the per-screenshot atlas diagrams

Written 2026-08-24, while replacing the Screen atlas's single ~90-node
"everything mixed up" mermaid diagram with one small diagram + accessible
text list per screenshot (see `src/content/mapScreens.ts`'s `actions` /
`goesTo` fields on `MapCase`, rendered in `ScreenAtlas.tsx`).

Building those per-screen diagrams required grep-verifying every real
`<Link to="…">` / `navigate({ to: '…' })` in each Nuclear view against the
`/more` atlas's claims (Tahti/apps/web side not re-verified — separate repo,
out of scope here). Findings below are real, source-grounded gaps in the
**Nuclear (this client)** navigation graph, not documentation drift.

## 2026-09-03 — Chrome vs sitemap vs inbound links

Re-audited persistent chrome (`AppShell`, `StudioNav`, `AdminNav`,
`MobileChrome`) against `router.tsx` and in-app `<Link>`/`navigate()` calls
(excluding atlas/`MoreView` diagnostics). [NAVIGATION-SITEMAP.md](NAVIGATION-SITEMAP.md)
now lists chrome separately from routes it does not actually own.

### Sitemap drift (docs claimed chrome that is not there)

1. **Listen does not include Venues.** The sitemap table listed `/venues`
   under Listen. Chrome is Listen / Radio / Discover / Favorites / Studio
   (+ Help / Settings). `/venues` has no sidebar, drawer, or bottom-nav
   entry. The only production links in are venue detail and venue register
   (back to the directory). Help Center does not mention it.

2. **Radio does not include the public `/schedule` page.** The sitemap said
   schedule is reached from the radio surface. `RadioView` has no such
   link. `/schedule` is only opened from `RadioBookingCalendar` and
   `ScheduleDialog` (book-a-slot flows). `/studio/schedule` is the artist
   Broadcast page (Perform submenu; nav label Broadcast since 2026-09-03) —
   a different page from public `/schedule`.

3. **Library submenu does not include Smart links or Distribution as
   first-class items.** `/library/smartlinks` is a real `LibraryView` tab
   with zero production inbound links. `/studio/distribution` is a
   Releases-row + export-add-on deep link. (Stash has its own
   `LIBRARY_SECTION_TABS` entry, `/library/stash` — `/studio/stash` is
   just a redirect to it, not a separate discoverability gap.)

### Still open (production orphans)

| Gap | Why it matters |
| --- | --- |
| `/venues` not in Listen/mobile chrome | Public directory is easy to miss; sitemap and Listen flow diagrams still imply it is a discovery sibling of Radio. |
| `/schedule` buried in booking UI | Listeners on Radio cannot see the programme without opening the calendar dialog. |
| `/library/smartlinks` unlinked | Smart-link manager exists but cannot be chosen from Library Overview / Sounds / Collections. |
| `/studio/distribution` Releases-only | Artists who are not on the releases list have no StudioNav path to delivery status. |
| `/jam/$code` unlinked | Join-by-code route has no in-app entry besides the atlas. |

### Checked this pass, not orphans

- Admin `/admin/beta`, support, radio-submissions, content-reports,
  feature-requests, missed-shows, files, activity: **redirects** into
  Moderation, Storage, or Logs — already in AdminNav.
- `/admin/orphan-pages` is in Admin → Manage.
- `/admin/map` and `/more` stay diagnostics-only by design.
- Help / Settings live in the desktop sidebar and mobile drawer (not the
  phone bottom bar). That is chrome, not an orphan.
- Member `/governance` remains Settings → Account only (see item 5 below).

## Real gaps

1. **Fixed this session — Music/Archive had no entry in the persistent
   Studio sidebar.** `StudioNav.tsx`'s "Music" tool group listed Upload,
   Collections, Recordings, and Audio editor — but not the catalog itself
   (`/studio/archive`), despite it being one of the most central artist
   surfaces. An artist who navigated to Revenue, Schedule, or Sources had
   no one-click way back to their track list from the always-visible
   sidebar; they had to go via Studio home, or a contextual link on
   whichever page happened to have one (Upload's post-submit redirect,
   Stats, the Pro editor's back-link). Added a "Music" entry
   (`ListMusicIcon`, first in the group) pointing at `/studio/archive`.

2. **Three studio screens have zero in-app navigation of their own** —
   `StudioRevenueView.tsx`, `StudioStashView.tsx`, and
   `StudioUpdatesView.tsx` contain no `<Link>`/`navigate()` calls at all.
   Revenue only opens the external Stripe portal (`window.open`). None of
   the three is actually broken — they all rely entirely on the persistent
   `StudioNav` sidebar — but they're worth a second look if any of them
   ever needs a "go to the thing I just created" contextual link (e.g.
   Updates → the post's public page once published). Stash's sidebar
   highlight works via `SECTION_PREFIXES`; it still has no dedicated
   submenu label (see 2026-09-03 table).

## Fixed this session (found while cross-checking, not pre-existing docs)

3. **Upload → Music was not durable.** `StudioUploadView` used to stay on
   the upload form after a successful upload, showing a local "Open in
   Music" link that vanished on refresh (ephemeral React state, no route).
   Now it navigates straight to `/studio/archive/$id` — see
   `CUTOVER.md`'s `FEATURES.md` "Upload job detail" line.

4. **`/studio/archive/$id` didn't handle a still-processing track.** Landing
   there right after upload (or refreshing while a file is transcoding)
   rendered the full edit UI as if the track were ready — Play, waveform,
   Normalize, and Auto-trim would act on audio that didn't exist yet.
   `StudioArchiveItemView` now polls while `status` is `PENDING`/
   `PROCESSING`, shows a processing banner, and disables audio-dependent
   actions until the track is `READY` (or shows an error state for
   `ERROR`).

## Checked, turned out fine (recording so this doesn't get re-investigated)

5. **Governance has no listener top-level sidebar/topnav entry** — intentional:
   the public member-gated route is reachable through the "Governance" button
   in Settings → Account (`SettingsPanels.tsx`). Artists also have the
   dedicated `/studio/governance` item in `StudioNav`, and board members have
   `/admin/governance` plus `/admin/agm` in `AdminNav`. The `/more` atlas is a
   diagnostics-only map entry, not a production navigation dependency. Keep
   these as distinct contexts rather than adding a duplicate global Governance
   item to the listener rail.

6. **Login + TOTP isn't a distinct route** — the atlas's `auth-totp` case
   lists a route of `/login (TOTP step)`, but the step actually lives
   inside the `AuthDialog` modal opened from `/login`, not a separate URL.
   Cosmetic only; the case's `new.caption` already says as much.

7. **Settings is reachable two ways** — a persistent icon button that opens
   `ConnectedSettingsModal` in place, and the real bookmarkable
   `/settings/$section` route (linked from `/more`). Both work; just be
   deliberate about which one a screenshot/QA pass targets.

## Method

Per-screen `actions`/`goesTo` data in `mapScreens.ts` was built from:
real `<Link to>`/`navigate({ to })` targets grepped from each Nuclear view
(ground truth for `goesTo`), aria-labels and button text (for `actions`),
and the persistent chrome (`AppShell.tsx`'s sidebar, `StudioNav.tsx`) is
deliberately **excluded** from each screen's `goesTo` list — it reaches
nearly every top-level section from anywhere and would make all 46
diagrams identical noise. That's also why gap #1 above matters: it's a
hole in the one navigation surface that *isn't* per-screen.

The 2026-09-03 pass inverts that method for orphans: chrome is the
inclusion test, then inbound links are checked so a page with no menu
item is not counted as reachable just because the atlas diagram mentions
it.
