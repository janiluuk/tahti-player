# E2E run findings (2026-10-19)

**Status:** partial

**Source:** full Playwright suite (`packages/tahti-web/e2e`, 67 tests) run twice on
2026-10-19 from branch `feat/queue-fullscreen-player`:

| Run  | Target                                             | Result                                   |
| ---- | -------------------------------------------------- | ---------------------------------------- |
| beta | `https://beta.tahti.live`, no `TAHTI_E2E_PASSWORD` | 2 passed · 65 failed (≈55 stop at login) |
| mock | local dev server, `VITE_FORCE_MOCK=1`              | 15 passed · 33 failed · 19 timed out     |

Step-by-step screenshots and a per-test finding note are on the Tahti map
(`/more#e2e-runs`, `src/components/E2eRunGallery.tsx`; data in
`src/content/e2eRuns.ts` + `src/content/e2e/{beta,mock}.json`, images in
`public/map/e2e/`). Tick items here; when a finding is fixed, also drop its
note from `MOCK_TRIAGE` / `BETA_TRIAGE`.

## App bugs

- [x] **Duplicate "Full screen" buttons.** Queue + player bar both use
      "Open full-screen player"; fullscreen minimize spec uses the player-bar
      test id.
- [x] **CSP violation on `/radio` (beta).** nginx `script-src` allows
      `blob:` + `'wasm-unsafe-eval'` (visualizer/wasm); hcaptcha hosts kept.
      Signed-out 401 noise on plugin-store still separate.
- [x] **Join on beta fails with a bare "Validation error".** `requestJson`
      now surfaces Zod `issues` (`field: message`) instead of only `error`.
- [x] **DSP landing cover has no accessible name.** `SmartLinkView` passes
      `imageAlt="{title} cover"` into `EntitySocialHeader`.

## Not usable / confusing / illogical views

- [x] **Community-guidelines toast** — sticky notification toasts use
      `top-center` so they do not cover the queue / Settings corner.
- [x] **Empty queue pane is always open.** Layout persist v8 defaults
      `rightCollapsed: true` (migrates existing opens closed once).
- [x] **Settings modal as a route target.** `/studio/branding`, channel designer,
      radio cover and plugin-store links open Settings (Channel & chat / Add-ons)
      over the app; URL now syncs to `/settings/$section` (`?tab=` / `?category=`)
      while open and restores the prior path (or `/`) on close.
- [x] **Branding buried three levels deep:** Visuals group renamed to Artist
      branding; heading added above branding panel; nav path points at
      `/settings/artist?tab=branding`. Gallery / channel designer / multicast
      placement still split (tab-overload / settings-as-route leftovers).
- [x] **Broadcast setup split** — Settings › Broadcast links to Studio ›
      Broadcast for the live session; Multistream / Green room open Settings ›
      Broadcast. Full tab consolidation still open under Tab overload.
- [x] **Tab overload (wrap → scroll):** SectionTabs / go-live nested nav,
      LibrarySectionTabs, and ModerationTabs use `overflow-x-auto flex-nowrap`
      instead of wrapping. Full Broadcast tab consolidation still open under
      settings-as-route leftovers if needed.
- [x] **Admin Moderation list truncates ticket titles** — subjects use
      `line-clamp-2` / `break-words` instead of a single-line truncate.
- [x] **Add-ons Activate + power toggle** — dropped the redundant Power
      accessory; Activate/Active CTA remains. (Header/Discover (i) info toggles
      stay — they expand different copy.)
- [x] **hearthis.at config** — configure expands inline (no stacked dialog);
      Uninstall lives in the card header actions.
- [x] **SoundCloud `?sc=connected` callback** — toast is now
      `"SoundCloud connected."` (provider-aware from `category`).
- [x] **Join form:** Account type has a visible label on its own row above
      Artist name (handle still auto-derived; no Username field).
- [x] **Subscribe page** — heading `Subscribe to {name}`; Log in / Join are
      real buttons.
- [x] **Advisory motion draft** — `MotionCard` DRAFT state badge label is
      `DRAFT`.
- [x] **Keyboard path to Radio** — Alt+Digit/Numpad/`key` 2 navigates to
      `/radio` (and 1/3/4/5 for the other Listen destinations).
- [x] **`/more` opens the Log in dialog** over the map for signed-out visitors
      — `/more` and `/admin/map` are on the anonymous allowlist.
- [x] **Beta public data hygiene:** soft-filter via `isPlausiblePublicName`
      on On-air Listen list + public governance history titles.

## Unwired components

- [x] **Edit track › Audio › Properties** — mock archive + uploads populate
      format / sample rate / bit depth / channels / bitrate.
- [x] **"Record broadcast"** — wired to `fetchAutoRecordEnabled` /
      `patchAutoRecordEnabled` (defaults on when unset).
- [x] **Uploads keep the raw filename** — default title strips the extension.

## Homebaked styles / non-library primitives

- [x] **Release date** — wider date field (`min-w-[11rem]`) so the value is not
      clipped (still native `type="date"` until a library picker exists).
- [x] **Sound editor labels:** Description matches Title (`text-sm font-semibold`).
- [x] **`ScreenAtlas` `ShotPane`** uses `ImageReveal` (light→dark fallback kept).
- [x] **`/more` jump nav:** hand-rolled `<a>` chips migrated to `ButtonAnchor`.

## Stale specs (fix the tests, not the app)

- [x] DSP landing spec accepts artwork beside the heading and first-matches
      the year / genre (#1143).

- [x] Login helpers read `TAHTI_E2E_EMAIL` / `TAHTI_E2E_PASSWORD` via
      `e2e/helpers/auth.ts` (shared `signIn` + constants).
- [x] Registration specs no longer wait for the removed Username field.
- [x] `layout-stability.spec.ts`: studio uses `[data-studio-shell]` /
      `[data-studio-navigation]`; admin uses `.admin-*-layout` + section tabs/menu;
      Library routes dropped from studio geometry list.
- [x] Channel-designer specs open Settings › Channel; "Background" replaces
      "Backdrop". Radio-cover already used the Settings modal.
- [x] Studio dashboard heading "Studio"; collections type tabs; track title →
      `/t/…`; Sounds (no "All sounds"); Library is its own sidebar section.
- [x] Add-widget dialog "Add Listen widgets"; artist Connections instead of
      "Export music"; go-live destinations / Settings Broadcast multistream;
      world map under Stats › Plays & listeners; Prep has no "Start rotation".
- [x] `listener-purchase-flow` uses `setSoundAccess`; subscription row "Ends on".
- [x] Favorites heading `exact: true`; admin role filter opens Select first.
- [x] Mock rotation total expects 10:34.

## Blocked

- [ ] Beta rerun with a real account (`TAHTI_E2E_EMAIL` / `TAHTI_E2E_PASSWORD`)
      gets past sign-in, then beta answers "Too many requests": the API counted
      logins in the same per-IP bucket as all other traffic. Fix + ops script
      are on tahti-org branches `fix/auth-rate-limit-own-bucket` and
      `feat/stack-env-script` (not pushed yet). Loosen with
      `scripts/stack-env.sh preset ratelimit-loose --apply`, rerun, refresh
      `src/content/e2e/beta.json`, then `preset ratelimit-default --apply`.
- [ ] `fan-sub-and-track-purchase.spec.ts` needs `TAHTI_E2E_RIFF_WAV` and fan
      accounts.

## Refreshing the map section

1. Run the suite with `screenshot: 'on'`, `trace: 'on'` and a JSON reporter.
2. For each test, pair every top-level step with the first non-blank
   screencast frame after it ends (from `trace.zip`), keeping up to 8 steps
   plus the final screenshot, as 960 px WebP.
3. Write `public/map/e2e/<run>/<test-id>/NN.webp` and
   `src/content/e2e/<run>.json` (`{ run, baseUrl, tests: [{ id, file, line,
title, status, durationMs, error, steps: [{ image, caption, failed }] }] }`).
