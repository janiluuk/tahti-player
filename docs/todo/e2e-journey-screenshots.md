# E2E journey screenshots (4 categories) — status: open

Ports `tahti-org`'s `apps/web` 4-category e2e journey/screenshot setup
(anonymous/listener/artist/admin, light+dark, 3440×1440) to
`@tahti-player/tahti-web`, adapted to this app's actual mechanics: real
`VITE_FORCE_MOCK=1` mock backend instead of a seeded database, and the
app's real `colorMode` theme setting instead of browser
`prefers-color-scheme` emulation.

## What shipped

- `packages/tahti-web/scripts/journeys/{lib,anonymous-journey,listener-journey,artist-journey,admin-journey}.mjs`
- `packages/tahti-web/scripts/run-e2e-journeys.sh` — one-shot runner: starts
  the dev server with the mock backend if not already up, prints the demo
  credentials in use, runs the requested journey(s). No database seed step
  exists or is needed — see `docs/E2E-JOURNEYS.md`.
- `pnpm --filter @tahti-player/tahti-web journeys[:anonymous|:listener|:artist|:admin]`
- `packages/tahti-web/docs/E2E-JOURNEYS.md` — full write-up: credentials,
  theme handling (`themeId` pinned to `nuclear:default`, never the app's own
  `nuclear:tahti-dark` skin — only `colorMode` varies), hero-shots-vs-sweep
  design (artist/admin each sweep ~30 tabs at a single theme to keep runtime
  sane; the light/dark comparison lives in a smaller hero set).
- Artist journey does a **real** file upload (`input[type=file]` + Upload
  button) that auto-navigates to the uploaded track's editor page, walks
  every Channel Designer tab, and every Add-ons store category
  (Export/Import cover the "paid content sell side" + import/export ask).
- Listener journey's fan-tier subscribe page is the matching "buy side".

## Flagged while running (not yet triaged/fixed)

1. **Bug — broken visual state on `/studio/sounds/$id` (track editor) after
   a fresh upload.** Both light and dark captures
   (`docs/e2e-journeys/artist/{light,dark}/04-track-view.png`) show every
   form field (title, description, release date, genre, audience, toggles,
   "Save"/"Private" pills, the revision drop zone) rendered with a solid
   red/coral/pink fill instead of the app's normal surface color — not a
   single stray element, the whole page. Reproduces in both themes.
   **Caveat:** these journeys set `colorMode`/`themeId` by writing directly
   to the `tahti-web-theme` localStorage key rather than through the real
   Settings → Add-ons → Themes UI (see `scripts/journeys/lib.mjs`), so this
   could be a theme-init race specific to that shortcut rather than
   something a real user hits — needs one manual pass through the actual UI
   (upload a track, open its editor page) to confirm before filing as a
   genuine product bug.
2. **UX — studio dashboard bottom row renders as unstyled solid-color
   blocks.** `docs/e2e-journeys/artist/light/02-studio-dashboard.png`: the
   "Shows / Music / Upload / Collections / Releases" quick-link row renders
   as flat purple/green/olive/red rectangles with barely-legible text,
   looking like a missing background-image/gradient or an unstyled
   fallback state rather than the intended card design. Also visible: some
   focus-ring-style borders (nav item, tab, "Open"/"Publish" buttons) that
   look like a stuck `:focus-visible` outline rather than intentional
   styling. Same caveat as above re: the localStorage theme-injection
   shortcut — worth a manual check first.
3. **Minor — `run-e2e-journeys.sh` port default (5195) is a convention
   picked for this task, not an existing repo standard** (existing capture
   scripts default to 5192 via `STUDIO_AUDIT_BASE_URL`, `vite dev`'s own
   default is 5180). No conflict since `--strictPort` is used, but worth
   aligning if these scripts get consolidated with the older
   `capture-*.mjs` family later.

## Remaining / follow-up

- Confirm findings 1–2 by reproducing through the real Settings → Add-ons →
  Themes UI (not the localStorage shortcut) before filing as product bugs.
- Consider whether `capture-studio-audit.mjs` (the existing exhaustive
  studio+admin sweep, single theme, no light/dark) should be retired in
  favor of `artist-journey.mjs`'s / `admin-journey.mjs`'s sweep mode, which
  covers the same ground plus real interactions — not done here to avoid
  breaking whatever currently depends on `docs/redesign-shots/studio-audit/`.
- `docs/e2e-journeys/` screenshots are not yet committed — review and commit
  the ones worth keeping as a reference (same convention as
  `docs/redesign-shots/`).

## Note on how this landed

This was originally built directly in the main checkout
(`/home/jani/workspace/tahti-player`) but a concurrent session switched
branches there mid-task (`master` → `chore/god-module-followups`) and wiped
all of it before it was committed. Redone from scratch in a dedicated
worktree (`../tahti-player-e2e-journeys`, branch `e2e/journey-screenshots`)
to avoid the same collision — see that branch for the actual commit.
