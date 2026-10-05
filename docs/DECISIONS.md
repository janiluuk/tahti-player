# Decisions log

Settled forks so agents do not re-litigate them. Append new rows; do not rewrite history.

| Date | Decision | Where |
| --- | --- | --- |
| 2026-09-05 | Sibling API/org checkout path is **`../tahti-org`** (not `../tahti`). Registry remains `../tahti-registry`. | `AGENTS-START-HERE.md`, `TAHTI.md` |
| 2026-09-05 | Completed agent todos fold into `docs/todo/HISTORY.md` and are deleted; active backlog is `docs/todo/INDEX.md` + open-only `WORKPLAN.md`. | `CLAUDE.md`, `AGENTS-START-HERE.md` |
| 2026-09-05 | `UI-REDESIGN-WORKLOG.md` is append-only ship diary — not the open backlog. | `AGENTS-START-HERE.md` |
| — | Governance is split by context: member `/governance`, artist `/studio/governance`, board `/admin/governance` + `/admin/agm`. No duplicate global-rail governance. | root `AGENTS.md` |
| — | Marketplace catalog is `tahti-registry`; runtime install list is on-disk `plugins.json`. Do not migrate runtime registry until adapter/contract accepted. | root `AGENTS.md` |
| — | Import-provider Configure must live in this player repo (modal: settings → test → save/enable). Do not parallel-configure in Tahti core. | root `AGENTS.md` |
| 2026-10-05 | **Configure lifecycle:** host-rendered modal (not SDK hook). Connection test → `{ ok: true } \| { ok: false, error }`; blocks Save when `connectionTest` is advertised. Save and Enable are separate (Enable only after successful test, or after Save when no test). | root `AGENTS.md`, `../tahti-org/AGENTS.md` |
| — | Ordinary pages keep persistent chrome; full-screen player, public share canvases, maximized Pro Editor may hide it. | root `AGENTS.md` |
| — | Advisory consultation ≠ binding AGM ballot until sibling API has bylaws-backed contracts. | root `AGENTS.md` |
| — | Page widgets configure from Settings → Add-ons, not a second Widgets settings section. | `packages/tahti-web/AGENTS.md` |
| 2026-09-05 | Root `AGENTS.md` is short; deep topics live under `docs/agent/*`. | `AGENTS.md` |
| 2026-09-05 | WORKPLAN is epics only; leaf tasks are `docs/todo/INDEX.md`. | `WORKPLAN.md` |
| 2026-09-28 | **Right rail is the queue only.** Chat and notifications are top-bar controls, never rail views or rail header toggles (supersedes the 2026-09-25 "kept in the rail as header toggles" choice). Channel pages open live chat at `/chat/$slug`. `RightRailTab` is the single literal `'queue'` so they can't return; `RightRailPanel.test.tsx` guards it. | `stores/layoutStore.ts`, `components/RightRailPanel.tsx` |
| 2026-09-28 | **Status bar is desktop-app only.** The web app never shows the bottom status bar (tracks, notifications, storage). `shouldShowConnectedStatusBar` takes a required `desktopApp`; `ConnectedStatusBar.web.test.tsx` guards it. | `lib/processingItems.ts`, `components/ConnectedStatusBar.tsx` |
| 2026-09-28 | **Governance documents live in Studio → Governance → Documents**, not in Help. Help keeps only a "Policies and service" section at the bottom (terms, privacy, licence, status, news, admin guide). Lists are in `content/documentLinks.ts`; `HelpGovernanceDocuments.test.tsx` guards it. | `views/HelpView.tsx`, `views/studio/StudioGovernanceView.tsx` |
| 2026-09-28 | **Never conclude "no channel" from a partial user.** Only `/api/auth/me` (flag `profileLoaded`) says whether an account has a channel; the login/TOTP/password-reset responses are summaries. Channel setup, the Studio "channel required" gate and onboarding provisioning wait for `profileLoaded`. | `stores/authStore.ts`, `components/ChannelSetupDialog.tsx` |
