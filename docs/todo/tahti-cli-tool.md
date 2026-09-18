# tahti-cli — CLI tool using the tahti-api client

**Status:** partial

Roadmap item (2026-09-07). Inspiration: [antiwork/gumroad-cli](https://github.com/antiwork/gumroad-cli)
— a thin CLI wrapping a product's API client for scriptable, terminal-first
access.

**Vision:** `tahti-cli` package that consumes the generated `tahti-org`
`api-client` SDK (same one `tahti-web` uses) to do things from the terminal:
list library items, search, maybe queue/play. Possibly a CLI UI (TUI) for
the player itself — not just a scripting wrapper.

Not scoped or designed yet:
- Auth story beyond the simple env-var token below (a config-file/device-
  code flow is still open if that turns out to be worth it).
- Scope beyond v1's single read-only command; playback/TUI is explicitly a
  stretch goal ("perhaps even"), not started.
- Relationship to [[desktop-pro-library]] (`docs/todo/desktop-pro-library.md`)
  — that's a GUI desktop player (Tauri), this is a terminal tool; independent
  efforts that happen to talk to the same API.

## v1 shipped (2026-09-18): package scaffold + `library list`

**Where it lives:** `packages/tahti-cli` in this workspace (`tahti-nuclear`) —
picked over "its own repo" since it needs no build coordination with
anything else here and a new pnpm workspace package costs nothing to split
out later if that ever matters.

**Consumes the generated `api-client` SDK — corrected, this premise was
wrong.** Checked `../tahti-org/packages/api-client`: it exists
(`@tahti/api-client`, `openapi-fetch`-based), but it's `private: true` and
lives in a separate repo/pnpm workspace with no publish step — not
importable from here without publishing it or vendoring its generated
types, which is real, out-of-scope repo-boundary work, not a CLI decision.
Checked how `packages/tahti-web` itself talks to the API and found it
**doesn't use `@tahti/api-client` either** — it hand-writes `fetch` wrappers
(`api/http.ts`'s `getJson`/`sendJson`). So the CLI does the same: plain
`fetch` against the real public HTTP API, no generated-client dependency at
all. This also sidesteps "where it lives" mattering as much as it seemed to.

**Auth story — used what already exists, didn't invent one.** `../tahti-org`
already has a personal-API-token mechanism
(`Authorization: Bearer tahti_...`, read/write scopes,
`apps/api/src/plugins/auth.ts` + `GET/POST /api/me/api-tokens`, with an
existing tahti-web UI at Settings → Account). v1 reads one from
`TAHTI_API_TOKEN` (env var) — the simplest possible integration with a
mechanism that was already fully built, not a new auth flow.

**v1 command:** `tahti library list [--json]` → `GET /api/me/sound` (the
artist's own uploaded library sounds — literally "list library items" from
the ask). Table or JSON output, `TAHTI_API_URL` override for
staging/local API testing.

**Structure:** `.mjs` runtime files (no build step) + a `.ts` test file per
file, matching `packages/tools`'s existing convention exactly (that
package also has `.mjs` sources + `.test.ts` files, no `type-check` script,
`tsconfig.json` scoped to `include: ["src/**/*.ts"]` only — `tsc --noEmit`
on a `.mjs`→`.ts` import boundary errors there too; this is an accepted
pre-existing repo pattern, not something this pass needed to fix).
`node:util`'s `parseArgs` for the one flag (`--json`) instead of adding a
CLI-framework dependency for a single command.

Verified: `pnpm --filter @tahti-player/tahti-cli test` (11/11), `lint`
clean, manual smoke test of `--help` / no-token error / unknown-command
error (all correct, see `packages/tahti-cli/README.md` for the exact
commands). Not tested against the real live API (no token available in
this environment) — the token-required path is covered by tests mocking
`fetch`, not a live call.
