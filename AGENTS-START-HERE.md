# AGENTS-START-HERE

Read this first. Open one more file only if the table says so. Stop when you have enough to edit.

## Sibling checkouts (canonical)

| Repo | Path from this monorepo | Role |
| --- | --- | --- |
| API + legacy `apps/web` | **`../tahti-org`** | Fastify API, Prisma, `@tahti/shared`, production Next client |
| Marketplace catalog | `../tahti-registry` | Store `plugins.json` / themes |
| This player fork | `.` (`tahti-nuclear`) | Nuclear player + `packages/tahti-web` |

Do not invent sibling API shapes. Inspect `../tahti-org` routes/DTOs first. Do not commit/push/deploy the sibling unless the user asks.

## Task → open this → stop

| Task | Open | Stop after |
| --- | --- | --- |
| Any new technical work | [`docs/todo/INDEX.md`](docs/todo/INDEX.md) | Know if an open todo already covers it |
| tahti-web UI / Studio / Listen / Admin | [`packages/tahti-web/AGENTS.md`](packages/tahti-web/AGENTS.md) | Workflow + ViewShell / Storybook rules |
| What product already does | [`packages/tahti-web/FEATURES-REMAINING.md`](packages/tahti-web/FEATURES-REMAINING.md) | Do not open full FEATURES matrix |
| Next engineering slices | [`packages/tahti-web/WORKPLAN.md`](packages/tahti-web/WORKPLAN.md) | Open sections only |
| Cutover / beta vs prod | [`packages/tahti-web/CUTOVER.md`](packages/tahti-web/CUTOVER.md) | Only if cutover/deploy scope |
| Listener/artist/admin gap ledger | [`packages/tahti-web/GAP-MAPPING.md`](packages/tahti-web/GAP-MAPPING.md) | Only if parity vs `apps/web` |
| Player core / plugins / themes | Root [`AGENTS.md`](AGENTS.md) + [`docs/agent/`](docs/agent/) | Matching on-demand file only |
| Settled forks / “already decided” | [`docs/DECISIONS.md`](docs/DECISIONS.md) | Matching decision |
| Storybook surface lookup | [`packages/tahti-web/STORYBOOK-SURFACES.md`](packages/tahti-web/STORYBOOK-SURFACES.md) | Matching row |
| Fork / API relationship | [`TAHTI.md`](TAHTI.md) | Path + ownership split |
| Ship loop (bump / deploy) | Skill `tahti-web-ship-loop` | Checklist |

## Do not scan (unless the user names them)

- Full [`packages/tahti-web/UI-REDESIGN-WORKLOG.md`](packages/tahti-web/UI-REDESIGN-WORKLOG.md) — append-only diary, not a backlog. Grep a date/title only if you need the narrative of a past ship.
- [`docs/todo/HISTORY.md`](docs/todo/HISTORY.md) — completed work. Open only to confirm something already shipped.
- Entire FEATURES shipped matrix, entire CUTOVER, all of `docs/todo/*.md` — use INDEX instead.
- Sibling repo “just in case” — only when the task needs a contract or parity check.

## Todo lifecycle (required)

1. **Start** — create or update `docs/todo/<slug>.md` with `**Status:** open|blocked|partial`. One file per task.
2. **Work** — keep the plan in that file (not only in chat). Update INDEX when status changes.
3. **Done** — append a short fold entry to `docs/todo/HISTORY.md`, **delete** the todo file, remove the item from INDEX, and **strip** matching finished checkboxes / punch-list lines from WORKPLAN (and any other active tracker). Do not leave completed work as active `[x]` noise in WORKPLAN.
4. **Before new work** — read INDEX only (not the whole `docs/todo/` directory, not HISTORY).

Status values: `open` | `blocked` | `partial` | (file deleted when done — never leave `done` files in `docs/todo/`).

## Source-of-truth map

| Doc | Purpose |
| --- | --- |
| `docs/todo/INDEX.md` | Open agent tasks only |
| `docs/todo/HISTORY.md` | Completed tasks (fold destination) |
| `FEATURES-REMAINING.md` | Open product gaps only |
| `FEATURES.md` | Full capability matrix (shipped + remaining) |
| `WORKPLAN.md` | Open engineering slices only |
| `CUTOVER.md` | Beta → prod cutover checklist |
| `GAP-MAPPING.md` | No-drop ledger vs legacy `apps/web` |
| `UI-REDESIGN-WORKLOG.md` | Chronological ship diary (append only) |
| `docs/DECISIONS.md` | Settled design forks |

## Always-on rules (pointers)

Canonical text lives in root `AGENTS.md` and `packages/tahti-web/AGENTS.md`. Cursor rules only point:

- Storybook-first UI
- Persistent chrome (+ test: confirm nav mounted)
- tahti-registry after plugin/theme changes
