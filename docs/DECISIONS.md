# Decisions log

Settled forks so agents do not re-litigate them. Append new rows; do not rewrite history.

| Date | Decision | Where |
| --- | --- | --- |
| 2026-09-05 | Sibling API/org checkout path is **`../tahti-org`** (not `../tahti`). Registry remains `../tahti-registry`. | `AGENTS-START-HERE.md`, `TAHTI.md` |
| 2026-09-05 | Completed agent todos fold into `docs/todo/HISTORY.md` and are deleted; active backlog is `docs/todo/INDEX.md` + open-only `WORKPLAN.md`. | `CLAUDE.md`, `AGENTS-START-HERE.md` |
| 2026-09-05 | `UI-REDESIGN-WORKLOG.md` is append-only ship diary — not the open backlog. | `AGENTS-START-HERE.md` |
| — | Governance is split by context: member `/governance`, artist `/studio/governance`, board `/admin/governance` + `/admin/agm`. No duplicate global-rail governance. | root `AGENTS.md` |
| — | Marketplace catalog is `tahti-registry`; runtime install list is on-disk `plugins.json`. Do not migrate runtime registry until adapter/contract accepted. | root `AGENTS.md` |
| — | Import-provider Configure must live in this Nuclear repo (modal: settings → test → save/enable). Do not parallel-configure in Tahti core. Open API questions (hook vs host modal; test contract; atomic save+enable) still unsettled — document before extending. | root `AGENTS.md` |
| — | Ordinary pages keep persistent chrome; full-screen player, public share canvases, maximized Pro Editor may hide it. | root `AGENTS.md` |
| — | Advisory consultation ≠ binding AGM ballot until sibling API has bylaws-backed contracts. | root `AGENTS.md` |
| — | Page widgets configure from Settings → Add-ons, not a second Widgets settings section. | `packages/tahti-web/AGENTS.md` |
| 2026-09-05 | Root `AGENTS.md` is short; deep topics live under `docs/agent/*`. | `AGENTS.md` |
| 2026-09-05 | WORKPLAN is epics only; leaf tasks are `docs/todo/INDEX.md`. | `WORKPLAN.md` |
