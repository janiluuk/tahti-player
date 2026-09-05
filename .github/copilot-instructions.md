# Copilot instructions

**Start:** [`AGENTS-START-HERE.md`](../AGENTS-START-HERE.md). Canonical detail: root [`AGENTS.md`](../AGENTS.md). Fork/API: [`TAHTI.md`](../TAHTI.md). Open tasks: [`docs/todo/INDEX.md`](../docs/todo/INDEX.md). Package rules: `packages/tahti-web/AGENTS.md`.

If anything here disagrees with `AGENTS.md` / `AGENTS-START-HERE.md`, those win.

## This repo

Tahti Player is a free, open-source music player (no ads, no tracking). This tree is the Tahti fork of [Nuclear](https://github.com/nukeop/nuclear) (`janiluuk/tahti-player`). Upstream is `nukeop/nuclear`.

`@tahti-player/tahti-web` (beta.tahti.live) talks to the sibling API at **`../tahti-org`**. Store catalog is **`../tahti-registry`**, not on-disk runtime `plugins.json`.

## Todo lifecycle

Done work → append [`docs/todo/HISTORY.md`](../docs/todo/HISTORY.md) → delete the todo file → update INDEX → strip finished items from `WORKPLAN.md`. Never leave `Status: done` files in `docs/todo/`.

## Do not

- Do not use Serena or any other tool that is not available in this workspace.
- Do not prefer an IDE test-runner over `pnpm test` / package filters.
- Do not invent API shapes for `tahti-web`. Check `../tahti-org` first.
- Do not skip `tahti-registry` after adding or changing a Store plugin or theme.
- Do not skim the full UI redesign worklog or HISTORY for “what’s next” — use INDEX + open-only WORKPLAN.
