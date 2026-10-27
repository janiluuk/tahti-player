# @tahti-player/tahti-ops

Maintainer CLI that folds scattered `scripts/` entrypoints into one help tree.
Product API / TUI commands stay in [`@tahti-player/tahti-cli`](../tahti-cli)
(`tahti`) — this package must not ship artist-facing API tooling.

Roadmap / inventory: [`docs/todo/tahti-ops-cli.md`](../../docs/todo/tahti-ops-cli.md).

## Commands

```bash
pnpm tahti-ops --help

# desktop app (needs Rust + Tauri system packages)
pnpm tahti-ops desktop run        # release build, then launch   (= pnpm desktop)
pnpm tahti-ops desktop launch     # launch the last build (Linux)
pnpm tahti-ops desktop dev        # dev mode with hot reload     (= pnpm desktop:dev)
pnpm tahti-ops desktop bundle     # installers / packages

# tests
pnpm tahti-ops test               # every package                (= pnpm test:all)
pnpm tahti-ops test web ui        # chosen groups: web ui player storybook types lint all
pnpm tahti-ops test web -- src/views/ListenView.test.tsx

# e2e
pnpm tahti-ops e2e journeys [listener]      # screenshot journeys on the mock app (= pnpm e2e)
pnpm tahti-ops e2e tasks artist --env-file ~/.tahti-e2e.env   # real backend (beta)
pnpm tahti-ops e2e playwright [spec]        # Playwright specs (PLAYWRIGHT_BASE_URL)

# snapshots
pnpm tahti-ops snapshots list               # snapshot files per group
pnpm tahti-ops snapshots update ui player   # re-record groups, then show changed .snap files
pnpm tahti-ops snapshots update all
pnpm tahti-ops snapshots update ui --only packages/ui/src/components/Dialog/Dialog.test.tsx
pnpm tahti-ops snapshots update surfaces    # STORYBOOK-SURFACES.md index

# web app and Storybook
pnpm tahti-ops deploy web         # build + ship beta.tahti.live over SSH (= pnpm deploy:web)
pnpm tahti-ops deploy web --ci    # dispatch the self-hosted deploy workflow instead
pnpm tahti-ops deploy storybook

# stack.env on the deploy host
pnpm tahti-ops env list
pnpm tahti-ops env get RATE_LIMIT_AUTH_MAX
pnpm tahti-ops env preset ratelimit-loose --dry-run

# local compose smoke (needs Docker + ../tahti-org)
pnpm tahti-ops stack smoke --dry-run
pnpm tahti-ops stack smoke

# backup ages
pnpm tahti-ops backup status --dry-run
pnpm tahti-ops backup status

# source file size guard (CI: pnpm check:file-size)
pnpm tahti-ops check size           # fail when a file over 800 lines appears or grows
pnpm tahti-ops check size --prune   # drop pins for files you split

# production deploys (needs SSH to the fleet)
pnpm tahti-ops deploy stack --dry-run
pnpm tahti-ops deploy all
```

Progress lines go to stderr (`→` / `✓` / `✗`); script stdout is unchanged.
`--dry-run` prints a one-line label and exits 0.

## Prefer these over raw scripts

| Instead of | Use |
| --- | --- |
| `../tahti-org/scripts/stack-env.sh …` | `pnpm tahti-ops env …` |
| `../tahti-org/scripts/stack-smoke.sh` | `pnpm tahti-ops stack smoke` |
| `../tahti-org/scripts/backup.sh status` | `pnpm tahti-ops backup status` |
| `../tahti-org/scripts/deploy_prod.sh` | `pnpm tahti-ops deploy stack` |
| `../tahti-org/scripts/deploy_worker_remote.sh` | `pnpm tahti-ops deploy worker` |
| `../tahti-org/scripts/deploy_minio_remote.sh` | `pnpm tahti-ops deploy minio` |
| (all three deploys) | `pnpm tahti-ops deploy all` (= `pnpm deploy:prod`) |
| `scripts/build-and-run-player.sh`, `pnpm player:build:run`, `pnpm build:linux:run` | `pnpm tahti-ops desktop run` (= `pnpm desktop`) |
| `scripts/run-linux.sh`, `pnpm player:run` | `pnpm tahti-ops desktop launch` |
| `packages/tahti-web/deploy/deploy-vimage.sh`, `pnpm deploy:tahti-beta` | `pnpm tahti-ops deploy web` |
| `packages/tahti-web/scripts/run-e2e-journeys.sh` | `pnpm tahti-ops e2e journeys` |
| `vitest run -u` per package | `pnpm tahti-ops snapshots update <group>` |
| `node scripts/check-file-size.mjs` (removed) | `pnpm tahti-ops check size` (= `pnpm check:file-size`) |

Cron entries may still call `backup.sh` directly on the host; operators use
`tahti-ops` from this monorepo.

## Environment

| Variable | Meaning |
| --- | --- |
| `TAHTI_ORG_ROOT` | Path to the tahti-org checkout (default: `../tahti-org`) |
| `DEPLOY_HOST` | SSH host for `env` / `deploy stack` (default `vimage`; `local` for this machine) |
| `DEPLOY_PATH` | Project path on the host (default `/srv/tahti`) |
