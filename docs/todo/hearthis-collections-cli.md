# hearthis.at Sets → Tahti collections (CLI)

**Status:** partial

Goal: import a whole hearthis.at account into Tahti as releases and
collections without uploading any track twice (branch
`feat/cli-hearthis-collections`).

Shipped in `packages/tahti-cli` (no tahti-org change):

- `src/commands/collections-create.mjs`: `tahti collections create` (`POST /api/me/collections`, cover via `cover/from-url`).
- `src/commands/hearthis-sounds.mjs`: upload ledger `<out>/.tahti-hearthis-sounds.json`, release-state migration, paged library read and match, shared download/upload steps.
- `src/commands/hearthis-collection.mjs`: `tahti hearthis collection` (state file `<out>/.tahti-collection-<permalink>.json`, Set-order adds, processing wait, skip or `--strict`).
- `src/commands/hearthis-release.mjs`: reads/writes the ledger, `--ledger`.
- `src/commands/hearthis-api-stub.ts`: shared fake API for the release and collection tests.

## Left to do

- [ ] One live run against tahti.live with a real account (dry run, then real): a Set, a release from an overlapping Set, then a rerun; then fold into HISTORY.

## Decisions to confirm

- Library dedup reuses a sound exported to hearthis.at as the track (`hearthisExportId`), else an uploaded sound with the same title and length within 2 s. hearthis.at embeds are never reused (they play from hearthis.at).
- `--private` = visibility DRAFT. Type is not sent unless `--type` is given (API default CUSTOM).
- `hearthis collection` skips non-downloadable / failed tracks and exits 1; `--strict` stops. `hearthis release` still stops (a release with a missing track is a different release), but only for tracks that would have to be uploaded.
- An existing collection with the same name and no state file stops the run; `--slug` adopts it.
