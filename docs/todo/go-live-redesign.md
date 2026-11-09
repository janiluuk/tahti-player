# Go Live redesign (Studio → Broadcast → Go live)

**Status:** partial

Discovery plan approved with the decisions below (2026-11-10). Brief: "Tähti Go Live Redesign - Agent Instructions" (6 Nov 2026).

## Findings

### 1. Route, page, inner tabs

- Route `/studio/go-live` (`router/routes-studio.tsx:47-54`); inner tab in `?tab=` (`prep | credentials | recording | destinations | green-room`, `views/studio/go-live/goLiveTabs.ts:2-26`, unknown → `prep`). `/studio/info` redirects here.
- Page `views/studio/StudioGoLiveView.tsx`; Prep is inline `PrepPanel` + `components/BroadcastPreflightPanel.tsx` + `go-live/SignalPanel.tsx`; Credentials `go-live/BroadcastCredentialsPanel.tsx`; Recording `go-live/RecordingPanel.tsx`; Destinations `go-live/MultistreamPanel.tsx`; Green room `go-live/GreenRoomSessionPanel.tsx`; shared state `go-live/useGoLiveState.ts`.

### 2. Navigation

- Sidebar: `components/AppShell.tsx` + `ui/SidebarNavigationItem.tsx`. Active = `bg-primary text-primary-foreground font-bold` (filled accent). `aria-current="page"` is set.
- Studio tabs (`components/StudioNav.tsx` `SUBMENUS`): Overview, Stats, Governance, Posts, Audience, Music, Broadcast. Broadcast sub-nav (`BROADCAST_SUBNAV_ITEMS`): Go live, Schedule, Events, Listening parties, Shows, Channel, Radio (`/studio/channel?tab=radio`). Mirror copy in `stores/navigationStructureStore.ts`.
- Studio tabs, Broadcast sub-nav and Go live inner tabs all render through `SectionTabs` → headless `Tab`; the selected tab is a filled `Button variant="default"` (`bg-primary`). They are `role="tab"` buttons: no `href`, no `aria-current`.

### 3. Theme system

- Tailwind v4 `@theme` in `tailwind-config/global.css`; light defaults on `:root`, dark on `[data-theme='dark']`. Basic themes via `data-theme-id` (6: default, aurora, ember, lagoon, arctic-moss, tahti-dark). 22 custom/preset themes as generated CSS (`themes/src/advanced/generator.ts`; Gruvbox is the default), plus user-built themes in `ThemeEditor`.
- Mode: `light | dark | dynamic` (clock). System preference is not followed. No high-contrast theme. `color-scheme` is never set. FOUC avoided by `public/theme-boot.js` before React.
- Existing tokens that fit: page `background`, raised `background-secondary`, control `background-input`, control border `border-input`, text `foreground` / `foreground-secondary`, accent `primary` / `primary-foreground` (+ `primary-strong`), live/danger/error `accent-red(-strong)`.
- Missing: `border-subtle`, `text-disabled`, a usable `focus-ring` (`--ring` exists but is white and unused), `status-offline`, `color-scheme` per theme.

### 4. Primitives to reuse

Button (+ `size="icon"`), ButtonLink, Input, Select, Tabs / SegmentedControl, Badge, Tooltip, Toaster (sonner), ConfirmDialog, Alert, InlineError, Loader, CopyButton, Dialog. **No Stepper and no Skeleton primitive** (only `RouteChunkSkeleton` in tahti-web).

### 5. Checklist logic (`StudioGoLiveView.tsx:86-120`, `useGoLiveState.ts`)

- Show title ready = `showInfoConfirmed || preflight.title` (server may prefill from a booking/scheduled show).
- Stream credentials = stream settings loaded (effectively always true for an artist with a channel).
- Encoder signal = `signal.connected || channelState === 'PREVIEW'`, polled every 4 s via `usePolling` (`GET /api/me/stream-settings/status`).
- Go Live is gated only on encoder signal + usage limit (`SignalPanel.tsx:82`), not on show info.
- Backend states: `OFFLINE | PREVIEW | LIVE` + `signal.connected`. **No reconnecting state**; it would be inferred client-side (LIVE without signal).

### 6. Show info API

- `GET` / `PATCH /api/me/channel/preflight` (tahti-org). Fields: `title` 1-140, `tagline` ≤200 nullable, `showType` `LIVE_SET | TALK`, `visibility` `PUBLIC | FAN_ONLY`, `autoPublish`, `seriesId`. **Partial updates supported.**
- **PATCH returns 409 until the encoder connects** (the broadcast row is created on ingest connect).
- Web offers a `PRIVATE` visibility the API rejects; no 140-char cap on the title input.
- Show type / visibility options are hard-coded in the web; series come from `GET /api/me/channel/show-series`.
- "Show avatar" uploads the **profile avatar**; per-broadcast cover is not patchable.

### 7. Links into removed / merged tabs

Go live inner tabs: `MultistreamStatusPanel.tsx:55`, `settings/panels/BroadcastPanel.tsx:197,217`, `StudioChannelView.tsx:355`, `StudioGoLiveView.tsx:103`, e2e `plugin-store.spec.ts:63`, `cutover-vital.spec.ts:50` (stale), unit `StudioNav*.test`, stories. Events: `prodPathRedirects.ts:16`, `api/notifications.ts:119`, Studio events views, e2e `routes-studio-content.spec.ts`. Listening parties: party views, `StudioReleaseDetailView.tsx:208`. Radio: `RotationEmptyWarning.tsx:25`, `prodPathRedirects.ts:37,56,58`, e2e `channel-clips.spec.ts`. User manual pages under `docs/user-manual/studio/` and `content/help.ts:339,348`.

### 8. Tests

Vitest + Testing Library (jsdom), Storybook 10 play tests in Playwright, Playwright e2e on the mock app, theme contrast tests in `themes/src/__tests__/contrast.test.ts`. **No axe / a11y scan and no visual regression.** No feature-flag mechanism. Studio strings are plain English (i18n only for nav labels).

## Proposed approach

1. Tokens: add `border-subtle`, `text-disabled`, `focus-ring`, `status-offline` to `global.css` (light + dark), the 6 basic theme files and the advanced generator (derived fallbacks so 22 presets and user themes keep working); set `color-scheme` per mode; extend the contrast test to the new pairs.
2. Primitives: `Stepper` and `Skeleton` in `@tahti-player/ui` with stories.
3. Nav: quiet active styles per level (sidebar control-surface fill, Studio tabs underline, Broadcast sub-nav control-surface fill), links with `aria-current="page"` instead of `role="tab"` for route navigation.
4. Go live: header with status chip (`role="status"`) + Help / Share icon buttons + Start broadcast; vertical stepper reusing the existing completion logic; Show info card with autosave once a session exists; old `?tab=` values map to `?step=`.
5. Redirects for Events / Listening parties / Radio only after sign-off.

## Decisions (2026-11-10)

1. **Show info before the encoder:** tahti-org change - show info saves as a pre-session draft that the broadcast picks up when the encoder connects.
2. **Visibility:** add `PRIVATE` to the API (only the artist can hear it, e.g. test runs); keep it in the web.
3. **Cover:** per-broadcast cover via the API (`artworkUrl` settable in the draft / PATCH), falling back to the profile avatar.
4. **Required steps:** show name and encoder signal gate Start broadcast; Stream credentials is informational; Recording, Destinations and Green room are optional.
5. **Reconnecting:** add an explicit reconnecting state in the backend (tahti-org ingest), not inferred in the client.
6. **Feature flag:** none; ship the new page directly.
7. **Navigation:** merge Events and Listening parties into Schedule (filtered) and Radio into Channel (Radio section), with redirects. Keep the current Studio tab order. While live, only show name and tagline are editable; type, visibility and series are read-only.

## Work order

1. tahti-org PR: pre-session show-info draft, `PRIVATE` visibility, settable `artworkUrl`, reconnecting state (+ OpenAPI / api-client).
2. ~~Tokens + `color-scheme` + contrast tests; `Stepper` and `Skeleton` primitives.~~ Shipped (`feat/go-live-tokens`): use `border-subtle`, `foreground-disabled`, `focus-ring`, `status-offline` and `Stepper` / `Skeleton` from `@tahti-player/ui` in steps 3-4.
3. Navigation quiet styles + merges + redirects.
4. Go live page: header, status chip, stepper, Show info card with autosave.
