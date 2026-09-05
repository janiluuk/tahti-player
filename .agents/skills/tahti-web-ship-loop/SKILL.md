---
name: tahti-web-ship-loop
description: Use when implementing, finishing, or shipping a tahti-web (beta) slice — Storybook lookup, todo file, version bump, deploy, and sibling API gate.
---

# tahti-web ship loop

## Before coding

1. Read [`AGENTS-START-HERE.md`](../../../AGENTS-START-HERE.md) and [`docs/todo/INDEX.md`](../../../docs/todo/INDEX.md).
2. Create/update `docs/todo/<slug>.md` with `**Status:** open|blocked|partial` and an INDEX row.
3. UI: check [`STORYBOOK-SURFACES.md`](../../../packages/tahti-web/STORYBOOK-SURFACES.md) / Storybook before hand-rolling.
4. API: inspect `../tahti-org` routes + shared DTOs. Never invent response shapes.

## While coding

- Prefer `ViewShell` for ordinary chrome pages; keep Studio/Admin/Listen nav mounted.
- Keep API clients in `packages/tahti-web/src/api`.
- User-visible copy matches existing Tahti wording; i18n where the package already uses it.

## Before claiming done

```bash
pnpm exec prettier --write <changed-files>
pnpm --filter @tahti-player/tahti-web type-check
pnpm --filter @tahti-player/tahti-web lint
```

- Bump `packages/tahti-web/package.json` patch version for user-visible changes (e.g. `0.0.83` → `0.0.84`). Skip docs-only.
- Append a short dated note to `UI-REDESIGN-WORKLOG.md` for user-visible ships (diary only).
- Deploy only if the user asks (`pnpm deploy:tahti-beta` / storybook deploy as applicable).

## Close the todo

1. Append summary to `docs/todo/HISTORY.md`.
2. Delete `docs/todo/<slug>.md` and remove the INDEX row.
3. Remove the item from `packages/tahti-web/WORKPLAN.md` if listed.
4. Do not leave `Status: done` files in `docs/todo/`.

## Never without explicit ask

Commit, push, deploy, or modify `../tahti-org`.
