# E2E journey screenshots (4 categories)

**Status:** partial

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

## Flagged findings — triaged 2026-09-25

Reproduced through the real Settings → Themes UI (not the localStorage shortcut), in mock mode:

1. **Red/pink track editor — not a bug.** It is the stock Nuclear light palette (`nuclear:default`: pink input fills, coral primary on the cover header), same as Storybook. The capture did show a real bug: the header's action buttons (pin, quick edits, editor, Public, Save) overlapped the track title, because `EntitySocialHeader` pinned actions absolutely with only `pr-12` clearance. Fixed: actions now sit in the header row (top-right, title wraps beside them); affects every entity header, including the artist page.
2. **Studio quick-link tiles — real bug, fixed.** `StudioActionTile` centred its icon over the whole tile, so the title band covered it; the icon now centres in the area below the band. The "stuck focus ring" borders are the Nuclear light theme's thick borders and offset shadows, not a focus state.
3. **Minor, open — `run-e2e-journeys.sh` port default (5195)** is not an existing repo standard (other capture scripts use 5180/5190/5192). No conflict thanks to `--strictPort`; align if the capture scripts are consolidated.

## Remaining / follow-up

- Consider retiring `capture-studio-audit.mjs` (exhaustive studio+admin sweep, single theme) in favor of `artist-journey.mjs` / `admin-journey.mjs` sweep mode; not done to avoid breaking whatever depends on `docs/redesign-shots/studio-audit/`.
- Finding 3 above.

## Note on how this landed

This was originally built directly in the main checkout
(`/home/jani/workspace/tahti-player`) but a concurrent session switched
branches there mid-task (`master` → `chore/god-module-followups`) and wiped
all of it before it was committed. Redone from scratch in a dedicated
worktree (`../tahti-player-e2e-journeys`, branch `e2e/journey-screenshots`)
to avoid the same collision — see that branch for the actual commit.
