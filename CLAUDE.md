# Instructions for Claude Code / coding agents

## Start here

1. Read [`AGENTS-START-HERE.md`](../AGENTS-START-HERE.md) (task → which file → stop).
2. Read [`docs/todo/INDEX.md`](todo/INDEX.md) for open work — **not** the whole `docs/todo/` folder and **not** `HISTORY.md` unless confirming a past ship.

## Todo lifecycle

For every task with a technical implementation (not a one-line fix):

1. **Create or update** one file under `docs/todo/`, named for the task. Keep the plan there as you go (durable after chat ends).
2. Set `**Status:**` to exactly one of: `open` | `blocked` | `partial`.
3. Keep [`docs/todo/INDEX.md`](todo/INDEX.md) in sync (add/update/remove the row).
4. **When done:**
   - Append a short entry to [`docs/todo/HISTORY.md`](todo/HISTORY.md) (append, never overwrite).
   - Delete the `docs/todo/<task>.md` file.
   - Remove its INDEX row.
   - Strip matching finished checkboxes / punch-list lines from `packages/tahti-web/WORKPLAN.md` and any other **active** tracker that still lists the work. Finished narrative belongs in HISTORY (or the append-only worklog diary), not as `[x]` clutter in WORKPLAN.
5. Do **not** leave files with `Status: done` in `docs/todo/` — done means folded + deleted.

## Do not

- Skim all of `docs/todo/` or the full UI redesign worklog to find “what’s next”.
- Re-open finished work from HISTORY into active WORKPLAN checkboxes.
- Commit, push, deploy, or edit `../tahti-org` unless the user asks.
