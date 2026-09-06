# Port mobile player/nav + Tahti-theme visuals from `apps/web`

**Status:** partial — item 1's core hide-bug fixed 2026-09-06 (see below);
items 1's stacking/slim-nav details, 2, and 3 still fully open.
**Repo:** this checkout (`tahti-nuclear` / Tahti Player). Source of truth for look-and-feel: sibling `../tahti-org`.

## 2026-09-06 progress

Fixed independently (a user bug report, not this ticket) then found to
overlap it: **"Compact player vanishes on mobile while playing" (item
1's first bullet, and target #1) is done.** `ConnectedPlayerBar` no
longer returns `null` for `isMobile && isPlaying` — removed that
condition entirely, gave mobile its own simplified layout (now-playing
info + large play/pause + queue button), and `ConnectedStatusBar`'s
`shouldShowConnectedStatusBar` no longer special-cases mobile+playing
either. See `docs/todo/HISTORY.md`'s "Mobile player bar: real play/pause
+ full-screen queue" entry for the full change.

**Not verified against this ticket's specific stacking requirement**
("stack it on top of the bottom nav with the same calc(nav height +
safe-area) offset; nav still tappable") — the fix makes the bar render,
but whether it visually sits correctly above `MobileBottomNav` (z-index/
position, not just DOM order) was not checked against a running app in
a mobile viewport; the Chrome extension was unavailable this session.
Worth a live check before considering target #1 fully closed. Targets
#2 (thumbnail glow) and #3 (Discover gateway viz) are untouched.

Three related ports. Done when a phone-width Tahti-theme session can: navigate from a slim bottom bar with a lit active section, keep a compact player stacked on that bar, open fullscreen player with visualizations, see cover-art glow on thumbnails, and see the Discover gateway background viz.

## Why it is broken today

- Compact player **vanishes on mobile while playing**: `ConnectedPlayerBar` returns `null` when `isMobile && isPlaying` (`packages/tahti-web/src/components/ConnectedPlayerBar.tsx`). Help copy even says the bottom nav “gives way” to the player — the opposite of `apps/web`.
- Bottom bar has **too many tabs**: Listen, Radio, Discover, Library, Studio, plus Queue (`MobileChrome.tsx` `NAV` + Queue button). `apps/web` studio uses four primaries + More; public site nav is four items.
- Fullscreen player exists (`FullScreenPlayer` + `ChannelVisualizer`) but is unreachable if the compact bar never shows.
- Thumbnail glow (`--card-bg-image` blur wash) lives on `apps/web` listen/directory cards, not in the Tahti theme card chrome here.
- Discover in `apps/web` sits on the persistent gateway `BgCanvas` (`subtle`). Player Discover uses `AmbientBackground` / `ChannelVisualizer`, and only when ambient is enabled for Tahti themes — it does not match the gateway scene.

---

## 1. Mobile player + bottom navigation

### Reference (`../tahti-org`)

| Piece | Where |
| ----- | ----- |
| Mini-player + expand / fullscreen | `apps/web/src/components/mini-player.tsx`, `apps/web/src/app/globals.css` (`.mini-player`, `.full-player`) |
| Stack: player **above** bottom nav | `globals.css` — `body:has([data-tahti-ui='studio'] .db-mobile-nav) .mini-player { bottom: calc(var(--mobile-nav-h) + env(safe-area-inset-bottom)); }` |
| Bottom nav (4 primaries + More) | `packages/ui/src/brand/StudioMobileNav.tsx`, `dashboard-nav.ts` `DASHBOARD_PRIMARY_NAV` |
| Active item | `usePathname()` exact `/dashboard`, else `pathname === href \|\| startsWith(href + '/')`; class `db-mobile-nav-item.active` |
| Fullscreen viz | `ChannelVisualizer` preset `WATER_RIPPLE` + blurred artwork `.full-player__backdrop` |
| Tokens | `--mobile-nav-h: 64px`; z-index: mini 38, nav 40, full player 60 |

Public listen pages share the same mini-player (root layout) even without studio nav; on studio/admin the offset keeps both visible.

### Target in Tahti Player

1. **Always show** the compact player on mobile when something is queued/playing (delete the `isMobile && isPlaying` hide). Stack it on top of the bottom nav with the same `calc(nav height + safe-area)` offset; keep nav tappable (`z-index` nav > compact player, full player above both).
2. **Slim the bottom bar.** Primary destinations only. Queue is a player-bar control, not a sixth tab. Extra destinations go behind More (reuse `MobileDrawer` / a More sheet), not extra tabs.
   - Listener: Listen, Discover, Radio, plus More (Library / Studio / account as needed).
   - Artist session: keep Studio reachable without crowding (More, or swap one listener tab) — never more than four tabs + More.
3. **Active state** from `activeMobileItem()` (`lib/navigationActive.ts`) must light the tab for the current **section** (`/`, `/discover`, `/radio`, `/library`, `/studio…`). Cyan/foreground treatment like `.db-mobile-nav-item.active`. In-page tabs (Listen / Feed / History) stay in-page; the bottom bar still shows Listen as active.
4. **Fullscreen** from the compact bar (existing expand) must work on phone: viz + cover wash + controls; Escape/minimize returns to compact bar **still stacked on nav**. Port fullscreen viz behavior from `mini-player.tsx` (`WATER_RIPPLE` / artwork backdrop), not only the existing `FullScreenPlayer` shell.
5. Safe-area padding on nav and player; main scrollport clears both.

Verify at 375px: play a track → bar visible above nav → expand fullscreen viz → dismiss → nav still shows the correct active section → tap another tab.

---

## 2. Thumbnail backdrop ambience (Tahti theme)

### Reference (`../tahti-org`)

Every listen/live/directory card paints a **blurred blow-up of its own cover/avatar** behind the row:

- CSS: `.listen-card::before` / `.listen-live-card::before` / `.artist-directory__card::before` in `packages/ui/src/styles/admin-ui.css` — `background-image: var(--card-bg-image); filter: blur(22px) saturate(1.15) brightness(0.55); opacity ~0.6; inset: -25%`.
- Inline: `--card-bg-image: url(...)` from `apps/web/src/app/listen/_listen-channels.tsx` and `_artist-directory.tsx`.
- Full-page variant (playlist): `.prof-collection-ambient-bg` (`brand-channel.css`) — `blur(70px) saturate(1.5) brightness(0.5)`.
- Palette extraction (`node-vibrant` → `--channel-*`) is a separate API path; the glow itself is the **CSS image wash**, not a sampled hex.

### Target

- Shared card/cover primitive in `@tahti-player/ui` or tahti-web, scoped to **`nuclear:tahti-dark`** (and Tahti blue if that theme already shares viz).
- Apply on Discover / Listen / Radio / library thumbnail cards (and collection/playlist heroes if those surfaces exist).
- No glow when there is no artwork (same no-op as `apps/web`).
- Do not invent a second color-extraction pipeline for the wash.

---

## 3. Discover-page background visualization (Tahti theme)

### Reference (`../tahti-org`)

`/listen` does **not** mount a channel preset. Root `PublicNavBg` → `BgCanvas variant="subtle"` (`apps/web/src/components/ui/bg-canvas.tsx` + `public-nav-bg.tsx`): Three.js particles/waveforms, Tahti palette, `z-index: -1`, veil, audio-reactive via shared analyser. Channel `ChannelVisualizer` presets stay on channel/radio/full-player.

### Target

- On Discover (and Listen home if it shares the gateway), under Tahti theme, show that **gateway** scene — not a random channel preset, not a flat `tahti-ambient-surface` tint.
- Existing `AmbientBackground` / Settings → Add-ons viz controls can remain for user-chosen extras, but default Discover should match `BgCanvas` `subtle`.
- Suspend or hide the gateway canvas when a page-level channel visualizer covers it (same as `apps/web` `useBackgroundCanvasSuspended`).

---

## 4. Storybook

Add stories in `packages/storybook/src/tahti-web/` (viewport **below 768px** so `md:hidden` chrome is visible — document that in the story, same note as `MobileChrome.stories.tsx`):

| Story | Show |
| ----- | ---- |
| Mobile chrome stack | Bottom nav (slim) + compact player sitting on it; playing + paused; active tab variants (Listen / Discover / Radio / Library / Studio) |
| Fullscreen player | Expanded sheet with viz + cover wash; minimize back to stack |
| Thumbnail glow | Grid/list of cards with/without cover; Tahti theme |
| Discover gateway viz | Subtle `BgCanvas`-equivalent behind Discover chrome |

Follow `packages/tahti-web/AGENTS.md` / `STORYBOOK-SURFACES.md`: Storybook first, flag missing states.

---

## Out of scope

- Changing Tahti org `apps/web` except if a missing API/palette field is discovered (then a sibling PR).
- Porting every M31 channel visualizer preset (already partially in `ChannelVisualizer`); this task is gateway Discover + card glow + mobile chrome/player viz.
- Desktop sidebar density.
