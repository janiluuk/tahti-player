# @tahti-player/tahti-cli

Terminal-first CLI for Tahti — thin, scriptable access to the public Tahti
API, in the spirit of [antiwork/gumroad-cli](https://github.com/antiwork/gumroad-cli).
See [`docs/todo/tahti-cli-tool.md`](../../docs/todo/tahti-cli-tool.md) for
the roadmap this v1 slice comes from.

## v1 scope

Read-only library listing only, per the original ask. No playback/TUI yet
(that's an explicit stretch goal in the roadmap doc, not started here).

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
pnpm --filter @tahti-player/tahti-cli exec tahti library list
pnpm --filter @tahti-player/tahti-cli exec tahti library list --json
pnpm --filter @tahti-player/tahti-cli exec tahti --help
```

## Commands

| Command | Description |
| --- | --- |
| `tahti library list [--json]` | List your own library sounds (`GET /api/me/sound`) |

## Not yet designed (see the roadmap doc)

- Where this CLI ultimately ships from (this workspace vs. its own repo).
- Playback / TUI.
- Anything beyond read-only listing.
