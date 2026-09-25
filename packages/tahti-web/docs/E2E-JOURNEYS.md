# E2E journeys (screenshots)

Four Playwright journeys, one per user category, matching the same split
used for `tahti-org`'s `apps/web`: **anonymous**, **listener**, **artist**,
**admin**. Each captures screenshots at 3440×1440 in both light and dark
`colorMode` (the app's real theme-mode setting — `src/plugins/themes/store.ts`
— not browser `prefers-color-scheme` emulation, since this app actually
implements the toggle).

**Theme note:** the app's own branded skin is `nuclear:tahti-dark` (its
`themeId`, display name "Tahti") — every journey pins `themeId` to
`nuclear:default` instead and only varies `colorMode`, so the light/dark
comparison isn't confused with that separate per-skin choice. See
`scripts/journeys/lib.mjs`.

## No database seed step

All 4 journeys run against `VITE_FORCE_MOCK=1`, which switches the app onto
its own built-in, hand-authored mock dataset (`src/api/mock*.ts` — releases,
tracks, channel design, studio stats, admin queues, etc. are already there).
There is nothing to seed. "Rich data" here means: use the mock backend, not:
run a seed script against a database.

## Credentials

| Persona  | How                                                                                     |
| -------- | ---------------------------------------------------------------------------------------- |
| Anonymous | No login.                                                                                |
| Listener | Injected directly into `localStorage` (`tahti-web-auth`) — the mock login always returns an ARTIST account (see `buildMockLoginUser` in `src/api/mock-session.ts`), so a channel-less listener can't come from a real login. |
| Artist   | Real login through the UI: `artist@tahti.live` / `demo-password` (mock mode accepts any password and builds the account from the email). |
| Admin    | Injected directly into `localStorage` — the mock login has no way to set `isBoard: true`. |

Override the artist credentials/slug with `JOURNEY_ARTIST_EMAIL`,
`JOURNEY_ARTIST_PASSWORD`, `JOURNEY_ARTIST_SLUG` env vars if needed.

## Run it

One command starts the dev server (if not already running), prints the
credentials in use, and runs all 4 journeys:

```bash
cd packages/tahti-web
./scripts/run-e2e-journeys.sh                # all 4
./scripts/run-e2e-journeys.sh artist admin   # only these
./scripts/run-e2e-journeys.sh --keep-up      # leave the dev server running after
```

Or via pnpm:

```bash
pnpm --filter @tahti-player/tahti-web journeys
pnpm --filter @tahti-player/tahti-web journeys:artist
```

Individually (dev server already up on port 5195):

```bash
VITE_FORCE_MOCK=1 pnpm --filter @tahti-player/tahti-web dev -- --port 5195
node scripts/journeys/anonymous-journey.mjs
node scripts/journeys/listener-journey.mjs
node scripts/journeys/artist-journey.mjs
node scripts/journeys/admin-journey.mjs
```

## What each journey covers

- **Anonymous** (`anonymous-journey.mjs`) — home/listen, radio, a public
  channel, artist profile, fan-tier subscribe page, venues, help,
  transparency, login, join. 10 steps × 2 themes.
- **Listener** (`listener-journey.mjs`) — library, history, favorites,
  messages, account settings, connected sources, a channel viewed while
  signed in, and the fan-tier subscribe page — the **buy side** of paid
  content. 8 steps × 2 themes.
- **Artist** (`artist-journey.mjs`) — the deep one:
  1. Studio dashboard.
  2. A **real file upload** (`input[type=file]` + the actual Upload button)
     that auto-navigates to the uploaded track's view/editor page — the
     "view the track" step.
  3. Channel designer, every tab (default, radio, green room, multicast,
     selects).
  4. Add-ons store, the Listener and Artist tabs with every group expanded
     (Admin is skipped, board-only) — the **sell side** of paid content lives
     in the Artist tab's Import and Releasing groups.
  5. An **exhaustive sweep of every remaining studio/settings tab** (~28
     routes) at a single theme (dark) — see "Sweep vs. hero shots" below.
- **Admin** (`admin-journey.mjs`) — 3 hero shots (dashboard, users,
  moderation) at both themes, then an **exhaustive sweep of every admin tab**
  (~35 routes) at a single theme (dark).

## Sweep vs. hero shots

Artist and admin each have dozens of tabs. Running every one of them at both
light and dark would roughly double an already-long run for pages that don't
carry the light/dark comparison as their point. So:

- A **hero set** (the pages that matter for reviewing the light/dark switch
  itself, plus the interactive flows) is captured in **both** themes, under
  `docs/e2e-journeys/<category>/{light,dark}/`.
- The **exhaustive "every tab"** pass is captured **once**, at dark, under
  `docs/e2e-journeys/<category>/sweep/`.

## Output

```text
docs/e2e-journeys/
  anonymous/{light,dark}/*.png + manifest.json
  listener/{light,dark}/*.png + manifest.json
  artist/{light,dark}/*.png + manifest.json
  artist/sweep/*.png + manifest.json
  admin/{light,dark}/*.png + manifest.json
  admin/sweep/*.png + manifest.json
```

Same convention as `docs/redesign-shots/`: no `.gitignore` exclusion, commit
the PNGs that are worth keeping as a reference (a full re-run regenerates
everything, so stale shots are fine to prune rather than precious to keep).

## Related tooling

This complements, rather than replaces, the existing per-route capture
scripts (`capture-atlas-shots.mjs`,
`capture-redesign-shots.mjs`, `capture-tahti-dark-refresh.mjs`) and the
`e2e/*.spec.ts` Playwright test suite (real assertions, run against a real
or mock backend via `playwright.config.ts`). The journeys here are
screenshot-first and organized by the 4 user categories rather than by
route or by feature.

See also `tahti-org`'s equivalent 4-category journeys
(`tests/e2e/{anonymous,listener,artist,admin}/`,
`docs/todo/e2e-journey-audit.md`) — same taxonomy, same
light/dark-not-brand-theme rule, different app.

## Known issues found while running these

See `docs/todo/e2e-journey-screenshots.md` for the full write-up — in short:
the uploaded track's editor page and the studio dashboard's quick-link row
both showed unstyled/broken color fills in the captured screenshots
(`docs/e2e-journeys/artist/{light,dark}/04-track-view.png` and
`02-studio-dashboard.png`). Not yet confirmed against a real (non-injected)
theme switch — do that before filing as a product bug.
