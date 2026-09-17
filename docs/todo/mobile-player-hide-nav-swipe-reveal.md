# Mobile: hide status bar; hide nav while playing, swipe up to reveal

**Status:** partial

Logged from a user request mid-session (2026-09-15). First pass implemented
2026-09-17 against explicit assumptions (below) since the original ask left
4 questions unanswered. Needs user confirmation that the assumptions match
intent; the "status bar" part is deliberately unimplemented (see Residual
ambiguity).

## Ask (verbatim)

"dont show the statusbar with mobile. if the player is playing, dont
show the navigation by default, swiping bit up should reveal it"

## Assumptions made (please correct any that are wrong)

1. **"Status bar"** — not implemented. The literal OS/browser status bar
   can't be hidden from an ordinary mobile browser tab via web APIs. This
   repo has no PWA manifest / `display: standalone|fullscreen` config, so
   there's no installed-home-screen-app path to even attempt it (that would
   be a separate, larger feature: manifest.json, icons, install prompt,
   `apple-mobile-web-app-*` meta tags, and a way to keep a static
   `theme-color` meta in sync with the app's per-theme oklch background so
   it doesn't go stale on light theme / custom themes). Nothing was added
   here to avoid a half-working cosmetic mismatch.
2. **"Bottom nav"** = `MobileBottomNav` (`nav[aria-label="Primary"]`) as
   rendered by `AppShell.tsx` on mobile. Desktop sidebar nav is untouched.
3. **Swipe-up gesture** = reveal-and-stay (no auto-hide timer) until
   playback stops; next time playback starts fresh, the nav hides again by
   default. Trigger zone = touch must start within 40px of the bottom edge
   of the viewport, so it doesn't hijack ordinary scroll gestures.
4. **Scope** = every mobile route where the bottom nav already renders
   today (i.e. not narrowed to Listen/Channel/Radio), gated purely by
   `usePlayerStore().status === 'playing'`. Read as "while something is
   playing", not "only on these specific screens" — e.g. browsing Library
   while a track keeps playing still hides the nav.

## What was built

- `packages/tahti-web/src/hooks/useAutoHideNavWhilePlaying.ts` — new hook,
  `useAutoHideNavWhilePlaying(isMobile, isPlaying): boolean`. Owns the
  reveal state + the bottom-edge swipe-up listener. The assumptions above
  are also written at the top of this file as a code comment.
- Wired into `packages/tahti-web/src/components/AppShell.tsx`: computes
  `mobileNavHidden` and conditionally skips rendering `<MobileBottomNav>`
  when hidden.
- Test: `packages/tahti-web/src/hooks/useAutoHideNavWhilePlaying.test.ts`
  (added `@testing-library/react` as a devDependency, matching the pattern
  already used by `packages/ui/src/hooks/useCollapsibleText.test.ts` —
  it wasn't previously a `tahti-web` dependency). Covers: desktop never
  hides; mobile hides only once playing; swipe-up near the bottom edge
  reveals; a swipe that doesn't start near the bottom edge is ignored;
  nav re-hides by default the next time playback (re)starts after a
  previous reveal; listener cleanup on unmount.

## Verified

- `pnpm --filter @tahti-player/tahti-web type-check` — passes.
- `pnpm --filter @tahti-player/tahti-web lint` — passes, no errors.
- `pnpm --filter @tahti-player/tahti-web test` — 95 files / 552 tests
  passing (baseline before this change: 94 files / 545 tests; all new
  tests pass, no regressions).
- Checked `e2e/real-user-journeys.spec.ts`'s mobile-viewport assertion on
  `nav[aria-label="Primary"]` (the persistent-chrome test) and
  `e2e/layout-stability.spec.ts`'s mobile Studio/Admin check — neither
  starts playback before asserting the nav is visible, so this change
  doesn't affect them. Did not run the full Playwright suite.
- **Not verified live**: a real mobile-viewport browser check (resize to
  phone width, start playback, confirm nav hides, swipe up, confirm
  reveal) was attempted via Chrome browser automation but the
  `resize_window` tool failed in this session's environment (bounds
  error, reproducible even on a no-op resize) — this is a tool/environment
  limitation, not something ruled out in the app. Needs a manual check on
  an actual phone or working devtools device emulation.

## Residual ambiguity / needs user confirmation

- Whether "status bar" really meant the OS chrome (in which case a
  standalone-PWA setup is a separate follow-up task) or was describing
  something else entirely (an in-app status/now-playing bar) — please
  clarify.
- Whether reveal-and-stay (vs. reveal-then-auto-hide) matches the intended
  feel, and whether hiding on every route (not just Listen/Channel/Radio)
  while something plays is desired.
- The live swipe-gesture feel (edge width, swipe distance threshold) is
  un-tuned past the unit-tested values (40px edge zone, 24px swipe
  distance) — untested on a real touchscreen.
