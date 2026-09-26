# @tahti-player/tahti-cli

Terminal-first CLI for Tahti — thin, scriptable access to the public Tahti
API, in the spirit of [antiwork/gumroad-cli](https://github.com/antiwork/gumroad-cli).
See [`docs/todo/tahti-cli-tool.md`](../../docs/todo/tahti-cli-tool.md) for
the roadmap this v1 slice comes from.

## Scope

Read-only commands only. No playback/TUI yet (that's an explicit stretch
goal in the roadmap doc, not started here).

## Auth

Tahti's API already has a personal API token mechanism
(`Authorization: Bearer tahti_...`, read/write scopes) — this CLI uses that
directly rather than inventing a new auth flow. It does **not** talk to
`../tahti-org`'s generated `@tahti/api-client` package: that package is
`private: true` and lives in a separate repo/pnpm workspace, so it isn't
importable from here without publishing it or vendoring its types — this
CLI instead makes plain `fetch` calls against the public HTTP API, the same
approach `packages/tahti-web` itself uses (it doesn't consume
`@tahti/api-client` either, despite the roadmap doc's original assumption
that it did).

1. Sign in at [tahti.live](https://tahti.live) → Settings → Account → API
   tokens → create a token.
2. `export TAHTI_API_TOKEN=tahti_...`
3. Optionally `export TAHTI_API_URL=https://api.tahti.live` (this is
   already the default).

## Usage

```bash
pnpm --filter @tahti-player/tahti-cli exec tahti --help
pnpm --filter @tahti-player/tahti-cli exec tahti whoami
pnpm --filter @tahti-player/tahti-cli exec tahti library list --sort title
pnpm --filter @tahti-player/tahti-cli exec tahti library show <id> --json
pnpm --filter @tahti-player/tahti-cli exec tahti releases list --limit 20
pnpm --filter @tahti-player/tahti-cli exec tahti releases list --help
```

## Commands

Every command accepts `--json` (prints the API response unchanged) and
`--help`. Tables use the same aligned layout, with `-` for empty values.

| Command | API route | Output |
| --- | --- | --- |
| `tahti whoami [--json]` | `GET /api/auth/me` | Username, display name, tier, membership, channel slug, storage used |
| `tahti library list [--sort <order>] [--json]` | `GET /api/me/sound` | Your library sounds (up to 100); `--sort` is one of `newest`, `oldest`, `title`, `duration`, `bpm`, `genre` |
| `tahti library show <id> [--json]` | `GET /api/me/sound/:id` | One sound's metadata (status, duration, visibility, genre, BPM/key, source format, dates) |
| `tahti releases list [--page <n>] [--limit <n>] [--json]` | `GET /api/me/releases` | Your releases (id, title, type, state, release date, track count); `--limit` is 1-100 |

All four are `GET` routes behind `requireAuth`, so any personal API token
works (the API only requires the `write` scope for non-GET requests).

`whoami` never prints your email in table output, and shows the username if
the display name is empty. `whoami --json` is the raw `/api/auth/me` response,
which does include the `email` field.

## Errors

| Situation | Message |
| --- | --- |
| No `TAHTI_API_TOKEN` | `Missing API token. Create a personal API token ...` |
| 401 (revoked, expired or wrong token) | `Token invalid or missing scope (<API message>) ...` |
| 403 | `Token invalid or missing scope (<API message>): this token is not allowed to access <path>.` |
| 404 | The API's message, e.g. `Sound item not found` |
| Network failure | `Could not reach the Tahti API at <url>: <reason>` |
| Unknown flag or bad value | The problem plus a pointer to `tahti <command> --help` |

All errors exit with status 1.

## Not yet designed (see the roadmap doc)

- Where this CLI ultimately ships from (this workspace vs. its own repo).
- Playback / TUI.
- Write commands (upload, edit metadata), which need a `write`-scoped token.
