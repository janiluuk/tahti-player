# tahti-ops — fold `scripts/` into a universal ops CLI

**Status:** partial

Maintainer/dev CLI that absorbs scattered `scripts/` entrypoints. Separate from
product [`tahti-cli-tool.md`](tahti-cli-tool.md) (`tahti` API/TUI) so artists can
install the product CLI without deploy SSH tooling.

**Binary:** `tahti-ops` (`@tahti-player/tahti-ops`) — root: `pnpm tahti-ops`  
**Decision:** product `tahti` stays API-only; ops lives in its own package
([`docs/DECISIONS.md`](../DECISIONS.md)).

## Shipped

| Command | Replaces | Notes |
| --- | --- | --- |
| `tahti-ops env …` | `scripts/stack-env.sh` | bundled script; prefers org copy when present |
| `tahti-ops stack smoke` | `scripts/stack-smoke.sh` | `--dry-run`; progress on stderr |
| `tahti-ops backup status` | `scripts/backup.sh status` | cron may still call the script on the host |
| `tahti-ops deploy stack` | `scripts/deploy_prod.sh` | flags: `--no-cache` `--down` |
| `tahti-ops deploy worker` | `scripts/deploy_worker_remote.sh` | flags: `--bootstrap-env` |
| `tahti-ops deploy minio` | `scripts/deploy_minio_remote.sh` | flags: `--bootstrap-env` |
| `tahti-ops deploy all` | stack → worker → minio | stops on first failure |

| `tahti-ops desktop run\|launch\|dev\|bundle` | `scripts/build-and-run-player.sh`, `scripts/run-linux.sh`, `pnpm dev`, `pnpm tauri build` | root `pnpm desktop`, `pnpm desktop:dev` |
| `tahti-ops test [group…]` | `turbo test` / per-package `pnpm --filter … test` | groups web ui player storybook types lint all; args after `--` |
| `tahti-ops e2e journeys\|tasks\|playwright` | `run-e2e-journeys.sh`, `*-tasks-journey.mjs`, `pnpm test:e2e` | `--env-file` for real-backend credentials |
| `tahti-ops snapshots list\|update` | `vitest run -u` per package, `generate-storybook-surfaces.mjs` | groups ui player hifi surfaces, or all; `--only <test>`; prints changed `.snap` files |
| `tahti-ops deploy web\|storybook` | `deploy-vimage.sh` in each package | `--ci` dispatches `deploy-tahti-web-selfhosted.yml` |
| `tahti-ops release prepare <version>` | `scripts/deploy-production.sh` (deleted) | wraps `prepare-release.mjs`; `--build` adds `tauri build`; refuses an existing tag |
| `tahti-ops package flatpak sources\|flathub` | `scripts/flatpak-generate-sources.sh`, `scripts/flatpak-update-flathub.sh` (deleted) | `--out <dir>`; `flathub <version>` needs `GH_TOKEN`; `update-flathub.yml` calls it |

Shared: `--help`, `--dry-run`, `TAHTI_ORG_ROOT`, short `→` / `✓` / `✗` labels.

## Cross-check of existing scripts (2026-10-20)

- `scripts/deploy-production.sh` is misnamed: it doesn't deploy. It bumps the desktop version, commits, tags `player@X` and runs `tauri build` — the release-prep job `pnpm release:prepare` and the release workflow already cover. Now `tahti-ops release prepare`; script deleted.
- `deploy-vimage.sh` (tahti-web, Storybook) tried `nvm use 22` before 24; this repo needs Node 24 — fixed to prefer 24.
- `build:linux:run` and `player:build:run` were the same script (the Linux one only checks `uname`); both now point at `tahti-ops desktop run`.
- Two web deploy paths exist: `deploy-vimage.sh` from a laptop over SSH, and the self-hosted CI workflow (fails when `/srv/tahti-beta/deploy` drifts to another owner; #1413 swaps the config in by rename). `tahti-ops deploy web [--ci]` exposes both.

## Progress

- 2026-10-27: `tahti-ops release prepare <version> [--build] [--dry-run]` replaces `scripts/deploy-production.sh` (deleted). Runs `prepare-release.mjs` (bump, metainfo, commit, tag), optional `tauri build`, prints the push command.
- 2026-10-27: `tahti-ops package flatpak sources [--out <dir>]` and `package flatpak flathub <version> [--dry-run]` replace `scripts/flatpak-generate-sources.sh` and `scripts/flatpak-update-flathub.sh` (deleted), ported to Node. Fixes the pnpm tarball name (the old script kept the `+sha512…` suffix of `packageManager`). `update-flathub.yml` calls the CLI.

## Script → command inventory

### tahti-org `scripts/` (primary)

| Script | `tahti-ops` surface | Status |
| --- | --- | --- |
| stack-up.sh | `stack up` / `stack down` | planned |
| stack-smoke.sh | `stack smoke` | shipped |
| unified-smoke.sh | `stack smoke --unified` | planned |
| status-monitor.sh | `stack status` | planned |
| stack-screenshots.sh | `stack screenshots` | planned |
| stack-env.sh | `env …` | shipped (bundled until org merges) |
| deploy_prod.sh | `deploy stack` | shipped |
| deploy_worker_remote.sh | `deploy worker` | shipped |
| deploy_minio_remote.sh | `deploy minio` | shipped |
| db-migrate-deploy.sh | `deploy migrate` | planned |
| init-secrets.sh | `init secrets` | planned |
| init-minio-buckets.sh | `init buckets` | planned |
| backup.sh | `backup run` / `backup status` | status shipped |
| backup-postgres.sh | `backup postgres` | planned |
| backup-minio.sh | `backup minio` | planned |
| restore-postgres.sh / restore-test.sh | `backup restore` / `backup restore-test` | planned |
| backup-drill.sh | `backup drill` | planned |
| install-crons.sh | `backup crons` | planned |
| next-release-tag.sh | `release tag` | planned |
| release-changelog.sh | `release changelog` | planned |
| release-meta.sh | `release meta` | planned |
| check-prod-readiness.sh | `check prod` | planned |
| check-mixcloud-prod.sh | `check mixcloud` | planned |
| check-revelator-prod.sh | `check revelator` | planned |
| check-distribution-prod.sh | `check distribution` | planned |
| sync-tor-exit-list.mjs / check-tor-exit-list-fresh.mjs | `check tor` | planned |
| channel-load-test.sh / editor-load-test.sh | `load channel` / `load editor` | planned |
| check-design-tokens.sh / check-reference-token-values.sh / check-font-weight-cap.sh / design-conformance-routes.sh | `check design …` | planned |
| dev-setup.sh | `dev setup` | planned |
| ci-check.sh | `ci check` | planned |
| ci-docker-cleanup.sh / docker-disk-cleanup.sh | `docker cleanup` | planned |
| run-e2e-journeys.sh | `e2e journeys` | planned |
| capture-e2e-screenshots.mjs / capture-mobile-screenshots.mjs / e2e-screenshots.sh / demo-live-screenshots.mjs | `e2e capture …` | planned |

### tahti-player `scripts/` (secondary)

| Script | Proposed surface | Status |
| --- | --- | --- |
| build-and-run-*.sh / run-linux.sh | `player build` / `player run` | planned |
| flatpak-*.sh / update-aur.sh | `package flatpak` / `package aur` | flatpak shipped (scripts deleted); aur planned |
| deploy-production.sh | `release prepare` | shipped (script deleted) |
| scripts/ci/* | keep CI-only; optional `ci digest` | planned |
| check-file-size.mjs | `check size` | planned |
| generate-storybook-surfaces.mjs | `storybook surfaces` | planned |
| close-external-issue.cjs | `github …` | planned |

### Keep package-local

`packages/tahti-web/scripts/` journeys / captures / route checks — fold only
frequent operator entrypoints later (`web audit` / `web journeys`).

## Done criteria

1. `tahti-ops --help` lists shipped groups
2. Day-1 + deploy documented; no active docs tell operators to run the raw scripts above
3. Wrapped scripts print a deprecation hint pointing at `tahti-ops …`
4. Product `tahti` unchanged / no deploy SSH in that package
