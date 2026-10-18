# E2E run findings (2026-10-19)

**Status:** open

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

- [ ] **Duplicate "Full screen" buttons.** The new queue-toolbar button
      (`SidebarQueuePanel.tsx`, `data-testid="queue-fullscreen-button"`) and the
      player bar (`ConnectedPlayerBar.tsx`) share the accessible name "Full screen".
      Give the queue one a distinct name (e.g. "Open full-screen player") or scope
      the spec; `fullscreen-player-minimize.spec.ts` fails on strict mode.
- [ ] **CSP violation on `/radio` (beta).** Inline script blocked by
      `script-src 'self' https://js.hcaptcha.com …`, plus three 401s for a
      signed-out visitor (`plugin-store.spec.ts:139`).
- [ ] **Join on beta fails with a bare "Validation error".** No field is
      highlighted; surface the API's field error (`real-user-journeys.spec.ts:47`).
- [ ] **DSP landing cover has no accessible name.** No `img` named
      "First Light EP cover" on mock (`cutover-vital.spec.ts:806`).

## Not usable / confusing / illogical views

- [ ] **Community-guidelines toast covers the bottom-right of every signed-in
      screen** (over the queue pane and the Settings modal) until acknowledged.
- [ ] **Empty queue pane is always open.** "Queue empty" with Discover/Radio
      takes ~20% of the width on every Studio/Library/Admin page.
- [ ] **Settings modal as a route target.** `/studio/branding`, channel designer,
      radio cover and plugin-store links open Settings (Channel & chat / Add-ons)
      over the app instead of a page; the URL and the visible surface disagree.
- [ ] **Branding buried three levels deep:** Settings › Artist › Visuals ›
      Branding, with no "Artist branding" heading. Gallery, channel designer and
      multicast live in three different places.
- [ ] **Broadcast setup split** between Studio › Broadcast (10 sub-tabs incl.
      Radio, Green room) and Settings › Broadcast (Radio, Green room,
      Multistream).
- [ ] **Tab overload:** Go live = 8 Studio tabs + 10 Broadcast sub-tabs wrapping
      ("Channel", "Radio" orphaned on row 2); Library = 10 tabs wrapping (Smart
      links, Local files); Admin › Moderation = four stacked tab rows.
- [ ] **Admin Moderation list truncates ticket titles** to "Cannot con…" in a
      narrow column next to a mostly empty detail pane.
- [ ] **Add-ons rows** have Activate + power toggle + gear for one add-on, and two
      unexplained stacked (i) buttons at the top right.
- [ ] **hearthis.at config** opens a second dialog stacked over the Add Listen
      widgets picker, with an orphaned "Uninstall" text button.
- [ ] **SoundCloud `?sc=connected` callback** lands on Settings › Add-ons with
      no confirmation that the connection worked.
- [ ] **Join form:** the Artist / Band · Collective toggle has no label and sits
      misaligned next to "Artist name".
- [ ] **Subscribe page** has no "Subscribe to …" heading; "Log in" / "Join" are
      bare inline text, not buttons.
- [ ] **Advisory motion draft:** after "Motion draft submitted for board review"
      the new motion shows no DRAFT state.
- [ ] **Keyboard path to Radio** stays on `/` in both runs
      (`cutover-vital.spec.ts:823`).
- [ ] **`/more` opens the Log in dialog** over the map for signed-out visitors.
- [ ] **Beta public data hygiene:** governance history shows "sjsj" /
      "jddkkfk"; On air lists a channel named "0fpmbnvefhfgrqd6fdp".

## Unwired components

- [ ] **Edit track › Audio › Properties** shows "—" for Format, Sample rate,
      Bit depth, Channels, Bitrate.
- [ ] **"Record broadcast"** is no longer on by default on Go live — confirm
      intended or rewire.
- [ ] **Uploads keep the raw filename** with extension as the title
      ("mastering-reference-loud.wav") and as the hero initial.

## Homebaked styles / non-library primitives

- [ ] **Release date** on the sound editor is a native date input clipped to
      "dd/mm/yyy"; no library date picker.
- [ ] **Sound editor labels:** "DESCRIPTION" uses a different label style
      (uppercase micro) from Title / Content type.
- [ ] **`ScreenAtlas` `ShotPane`** renders a raw `<img>` (use `ImageReveal` like
      `E2eRunGallery`).
- [x] **`/more` jump nav:** hand-rolled `<a>` chips migrated to `ButtonAnchor`
      in this change.

## Stale specs (fix the tests, not the app)

- [ ] Login helpers hard-code `artist@tahti.live`; read `TAHTI_E2E_EMAIL` like
      `listener-purchase-flow.spec.ts` so beta runs can use a real account.
- [ ] Registration specs wait for the removed Username field
      (`cutover-vital.spec.ts:37`, `real-user-journeys.spec.ts:73`).
- [ ] `layout-stability.spec.ts`: `[data-studio-section-menu]`,
      `.admin-page-layout`, `[data-admin-section-*]` selectors are gone.
- [ ] Channel-designer / radio-cover specs expect Studio pages that are now the
      Settings modal; "Backdrop" option is now "Background".
- [ ] Studio dashboard heading is "Studio" (no greeting); collections filters are
      chips; track title opens the track page (no "Track info" dialog); "All
      sounds" link removed; Library is not a Studio tab.
- [ ] Add-widget dialog is "Add Listen widgets"; Settings › Account has no
      "Export music"; multistream providers moved to Settings › Broadcast;
      world map moved to Stats › Plays & listeners; Go live has no "Start
      rotation".
- [ ] `listener-purchase-flow.spec.ts:135` calls removed mock
      `setSoundPurchaseAccess`; subscription row says "Ends on …", not "cancels".
- [ ] Favorites heading locator needs `exact: true`; admin role filter options
      only mount when the Select opens.
- [ ] Mock rotation total is 10:34, spec expects 15:13.

## Blocked

- [ ] Beta run needs `TAHTI_E2E_PASSWORD` (and the specs reading
      `TAHTI_E2E_EMAIL`) to get past sign-in — rerun and refresh
      `src/content/e2e/beta.json` once available.
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
