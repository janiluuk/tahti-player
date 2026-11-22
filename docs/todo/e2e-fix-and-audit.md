# Fix the e2e suite and audit that the specs are current

**Status:** open

Requested 2026-11-22.

## Scope

- `packages/tahti-web/e2e/` has about 70 spec and helper files. CI's `e2e-mock` job runs `roles-*`, `use-cases-*`, `routes-uncovered`, `view-before-edit` and `batch-fixes*` against the mock app (`--workers=2 --retries=1`); every other spec only runs by hand (beta / prod journeys).
- Known red: `use-cases-artist-5` "publishes a draft release". The "Open release embed" link moved into the "More release actions" overflow menu, and the test still looks for it on the page (reported in PR #2079).

## Plan

1. Run the CI set locally against a `VITE_FORCE_MOCK=1` vite on 127.0.0.1 (memory: `tahti-web-local-testing`), with no retries, and list every failure.
2. Fix each failure at the right end: a stale selector or flow → update the spec; a real app bug → fix the app and keep the test.
3. Audit the specs that are not in CI: for each, record whether it still matches today's navigation (Studio six tabs, Library Favorites · Playlists · History · Following · Files, Admin hubs, Settings account-only, Go live takeover). Delete specs that only cover removed screens, fold duplicates, and move the useful ones into the CI glob.
4. Check that recent features have coverage: channel hover / Shift+queue, radio row add, Discover events, Library Playlists, Google/Facebook sign-in buttons.
5. Write the result as a table here (spec → in CI? → status → action) and update `e2e-coverage-gap.md`.

## Done when

The CI e2e set passes locally twice in a row with `--retries=0`, every spec outside CI is either current or deleted, and the table above is filled.
