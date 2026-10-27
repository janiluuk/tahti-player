# Navigation flow audit — inconsistencies, gaps, dead links

**Status:** open

2026-10-19 sweep. 180 routes across 13 `routes-*.tsx` files; ~41 covered by any e2e test (66 % gap); chrome nav consistent (AppShell + StudioNav/AdminNav map to declared paths). Findings below ordered by severity.

---

## 1. Governance / Transparency sub-routes — back arrows point to root (OK) but no "← Close" from tabbed children

### 1a. `PublicGovernanceHistoryView` → `/governance` ✅
**Done:** back link is `← Governance` → `/governance` (was Transparency overview).

### 1b. No explicit exit from tabbed governance children (`/governance/meetings/$id`, `/governance/motions/$id`)
`GovernanceMeetingDetailView.tsx:57` and `GovernanceMotionDetailView.tsx:75` correctly link back to `/governance`. Good. But the feature-requests child (`FeatureRequestsView.tsx:83`) renders its "← Governance" link **only when `embedded=false`**; in embedded mode inside `StudioGovernanceView` there is no visible exit — the user must use browser back or the left sidebar. That's intentional (embedded sub-tab) but worth noting as a discoverability gap on wide screens.

---

## 2. Admin routes accessible only via deep link or tab-redirect (no nav-chrome entry)

These are valid for bookmarks/redirects, but 6 of them have **zero inbound `<Link>` from `AdminNav`:**

| Route | Pattern | How reached |
| --- | --- | --- |
| `/admin/activity` | redirect → `/admin/logs` (same component) | Old bookmark / e2e indirect |
| `/admin/disco-widgets` | redirect → `/admin/addons` | Bookmark only (no incoming `<Link>`) |
| `/admin/grants/$year` | child route of `/admin/governance/$tab` | Deep link from a governance meeting note (`MotionMeetingNote.tsx:22`) — OK, but no nav-chrome entry point |
| `/admin/moderation/$tab` | sub-routes rendered inside `AdminModerationView` | Clicking mod filters navigates here (via `navigate({ to: "/admin/moderation", search: { tab … } })`) — functional, not nav-chrome |
| `/admin/orphan-pages/$tab` | sub-route of orphan-pages | Same pattern as moderation — functional redirect, no chrome entry |
| `/admin/support` | now a tab inside `AdminModerationView` (merged) | No dedicated nav item; rendered via `/admin/moderation?tab=support`. This is fine but **not obvious** to someone typing the old URL. |

Not regressions — these are historical merges. All renderable, none lead to 404. But they create a **silent fragility**: if `AdminModerationView` ever drops one of those tabs (e.g., `admin/support`, `admin/reports`), there's no nav-chrome assert that will surface it. The `AdminNav.tsx` array is not exhaustive — several routes are only reachable via tab redirects or deep links. Not a bug today; a maintainability risk if the admin nav grows further.

---

## 3. Listen sub-routes (`/listen/*`) have no dedicated nav chrome entries

The `/listen/*` namespace has three children:
- `/listen/feed`, `/listen/favorites`, `/listen/history`

All three redirect to (or are aliases of) their non-`/listen` equivalents — `AppShell.tsx:165,189` links directly to `/`, `/favorites`. The `/listen/*` routes exist for URL hygiene and embed contexts. This is **correct** but could confuse a new developer looking for a "Listen" nav entry. No issue to fix; note for documentation.

---

## 4. ChannelView — back arrow navigates via `router.history.back()` (not `<Link>`) ✅

**Done:** ChannelView uses `BackButtonLink to="/"`; TrackHero's history-back
fallback (no channel username) goes to `/` when there is no in-app history
(batch 89).

**File:** `src/views/ChannelView.tsx:593-596` — the back button uses an `onClick={() => router.history.back()}` pattern with an `ArrowLeftIcon`. This is functional but inconsistent with other entity-detail views that use declarative `<Link>` (bookmarkable, keyboard-accessible without JS). `TrackHero.tsx:134` uses the same `router.history.back()` pattern in the share overlay — intentional for a toast-like overlay but worth noting as an inconsistency surface.

---

## 5. Studio entity detail views — all have proper back links (verified)

Checked:
- `StudioSoundView.tsx:47` — `<Link to="/studio/releases"><ArrowLeftIcon/> Back to releases</Link>` ✅
- `StudioReleaseDetailView.tsx:141` — `<Link to="/studio/releases">← Back to Releases</Link>` ✅
- `StudioTrackInsightsView.tsx:19-23` — `<Link to="/studio/sounds">← Music</Link>` ✅
- `StudioMasteringView.tsx:89-94` — `<Link to="/studio/sounds">← Music</Link>` ✅
- `StudioCollectionEditView.tsx:40-42` — conditional back link ✅
- `StudioEditEventCreateView.tsx:186` — back button (Button, not Link, but functional) ✅

First subagent was **wrong** on this class of issues. These are all wired correctly.

---

## 6. Admin governance views — no per-level breadcrumbs ✅

**Done (verified 2026-10-27):** `AdminGovernanceView` shows Admin → Governance → <tab>, and `AdminGrantCycleView` shows Admin → Governance → Grants → <year>.

`AdminGrantCycleView` is a child route (`/admin/governance/$tab?tab=grants`) with the admin section tabs as chrome. It has an arrow-left return to `/admin/governance` in `AdminGate.tsx:40`, but the path inside `/admin/governance/$tab` is not breadcrumb-visible (you must click the "Governance" tab in chrome nav). This mirrors the pattern for all 3 tabbed admin routes (`governance/$tab`, `moderation/$tab`, `orphan-pages/$tab`). **Low severity** — chrome tabs show you where you are, but a user clicking through from a governance meeting note will not see the breadcrumb `/admin › Governance › Grants › Cycle`. Minor UX polish target.

---

## 7. E2e coverage gaps (66 % of routes)

**13 e2e files**, ~41 unique route visits (out of 180). Key missing areas:

| Area | Routes with zero e2e visit | Count |
| --- | --- | --- |
| **Governance** | `/governance`, `/governance/members`, `/governance/meetings/$id`, `/governance/motions/$id`, `/public-governance-history`, `/feature-requests` | 6 |
| **Listen (discover/feed/radio/show)** | `/listen/feed`, `/discover`, `/radio`, `schedule`, `/radio/show/$channelSlug`, `/themes`, `/search` | 7 |
| **Public/reader** | `/subscribe/$username`, `/r/$slug`, `/t/$id`, `/v/$slug`, `/embed/*, terms, privacy, agpl, about, how-it-works, what-is-it` | 12 |
| **Library deep** | `/library/favorites`, `/library/history`, `/library/local`, `/library/media`, `/library/embeds`, `/library/smartlinks`, `/library/recordings` | 7 |
| **Studio content ops** | All studio sound/release/collection event/edit/playlist/show-episode review, all studio stats sub-pages, studio updates, audience/revenue/stripe, distribution, moderation, revenue, stash, channel-branding, go-live sessions/green-room | ~30 |
| **Admin deep** | `/admin/activity`, `/admin/addons`, `/admin/beta`, `/admin/disco-widgets`, `/admin/files`, `/admin/grants/$year`, `/admin/orphan-pages/$tab`, `/admin/reports`, `/admin/radio-submissions`, `/admin/radio-station-suggestions`, `/admin/support`, `/admin/feature-requests`, `/admin/content-reports`, `/admin/moderation/$tab` | ~14 |

The biggest **user-facing** gaps:
- Governance (member+board flows, motions, meetings) → 0 visits anywhere in e2e.
- Discover + Radio + Themes → completely untested at route level.
- Public subscriber pages (`/subscribe/$username`, `/r/$slug`, `/t/$id`) — a user reaching these from outside the app has zero e2e safety net.

---

## 8. Missing `data-testid` on nav chrome elements (layout-stability fragile) ✅

**Done:** `AdminPageLayout` carries `data-admin-shell`; `layout-stability.spec.ts` finds the admin shell by it instead of the `.admin-page-layout` / `.admin-moderation-layout` classes.

**File:** `e2e/layout-stability.spec.ts:130-133,144-146` — Studio shell checks use `[data-studio-shell]`, `[data-studio-navigation]`, `[data-admin-section-tabs]`. These are good. But some views reference chrome elements via CSS selectors (`.admin-page-layout`) rather than stable `data-testid` attributes, making them brittle to class-name changes in Tailwind builds. Minor polish target.

---

## 9. Settings `$section` redirect — intentional but a source of dead links on bookmarks ✅

**Done (verified 2026-10-27):** `/settings/money`, `/settings/fan-subs` and `/settings/fan-tiers` now land on Studio → Revenue, and `/settings/audience` on Studio → Audience.

**File:** `routes-settings.tsx:12-24` — `/settings/audience`, `/settings/money`, `/settings/fan-subs`, `/settings/fan-tiers` all redirect to `/studio/audience?tab=…`. The route definition exists for backward compatibility but there is no visible indicator in a browser's address bar that the URL has changed. A user who bookmarks `/settings/money` and shares it will land on Studio → Audience, which may be confusing (the page header says "Audience", not "Money settings"). Consider adding a redirect notice or updating the tab label to read "Revenue" instead of "Money".

---

## 10. Cross-page navigation — no consistent link color/arrow between sections

When navigating **across** app boundary zones, the back-link patterns diverge:
- **Listen → Studio**: from `/studio` there is a top-nav button (AppShell + UserMenu). No explicit "listen" entry on every studio page other than the always-mounted sidebar button. This is fine but visually subtle — `<Link to="/"/>` renders as `TahtiLogo.tsx:18` which only appears at the top of AppShell.
- **Studio → Listen**: Studio pages use left sidebar chrome (not visible on mobile). Mobile users have `MobileChrome.tsx:86` which maps to StudioNav/Sidebar items, but on narrow screens the "Listen" logo link is the primary way out. This is correct but the transition between app sections lacks a dedicated cross-section breadcrumb ("Listen › Studio › Releases").
- **Public → Studio**: Artist/public pages have back links like `ArtistReferenceSections.tsx:65` pointing to `/u/$username`, which is consistent (artist's own page). No issue.

---

## Summary (severity + recommendation)

| # | Issue | Severity | Action |
| --- | --- | --- | --- |
| 1b | `FeatureRequestsView` hides back link in embedded mode | Low | Embedded exit + full-page link → `/governance/feature-requests` (batch 80/81) |
| 2 | Admin routes silently reachable via tab-redirect (6 items with no nav-chrome entry) | Medium | Document the tab-mapping in a `NAVIGATION-SITEMAP.md` comment block inside `AdminNav.tsx`; add `as const` assertion to verify every admin route has either a Primary entry or an explicit mapping list |
| 4 | `ChannelView + TrackHero` use imperative `router.history.back()` instead of `<Link>` | Low | Convert to `<Button onClick={goBack}>` (fine for overlay), but keep `<Link>` in navigational chrome views |
| 6 | No breadcrumb trail inside tabbed admin routes | Low | Grant cycle (81); Moderation + Orphan pages breadcrumbs (batch 82) |
| 8 | Missing `data-testid` on nav chrome | Low | `admin-page-layout`, `listen-shell`, `app-top-nav` (81); `studio-navigation` / orphan layout (82) |
| 7 | 66 % route gap in e2e tests, governance+discover completely untested | High | Prioritize governance (member flows) and discover/radio/subscribe routes |
| 9 | Settings `$section` redirect silently changes URL without notice | Low-Medium | money/fan-* → `/studio/revenue`, audience → `/studio/audience` (batch 82) |
