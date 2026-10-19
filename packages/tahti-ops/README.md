# @tahti-player/tahti-ops

Maintainer CLI that folds scattered `scripts/` entrypoints into one help tree.
Product API / TUI commands stay in [`@tahti-player/tahti-cli`](../tahti-cli)
(`tahti`) — this package must not ship artist-facing API tooling.

Roadmap / inventory: [`docs/todo/tahti-ops-cli.md`](../../docs/todo/tahti-ops-cli.md).

## Commands

```bash
pnpm tahti-ops --help

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
| (all three deploys) | `pnpm tahti-ops deploy all` |

Cron entries may still call `backup.sh` directly on the host; operators use
`tahti-ops` from this monorepo.

## Environment

| Variable | Meaning |
| --- | --- |
| `TAHTI_ORG_ROOT` | Path to the tahti-org checkout (default: `../tahti-org`) |
| `DEPLOY_HOST` | SSH host for `env` / `deploy stack` (default `vimage`; `local` for this machine) |
| `DEPLOY_PATH` | Project path on the host (default `/srv/tahti`) |
