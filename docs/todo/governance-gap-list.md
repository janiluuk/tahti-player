# Governance gap list: tahti-player vs tahti-org

**Status:** open

Gap analysis of governance features available in the sibling API (`../tahti-org`) but missing or incomplete in `tahti-player` / `tahti-web`.

## Member-facing gaps

| # | Gap | API endpoint | Notes |
| --- | --- | --- | --- |
| ~~1~~ | ~~**Motion detail view**~~ (`/governance/motions/:id`) | `GET /api/v1/governance/motions/:id` | **Done** (2026-09-08) — `GovernanceMotionDetailView.tsx` + `fetchGovernanceMotion(id)`; see `governance-gap-list-top3.md` fold in HISTORY. |
| 2 | **Bulk motion comments** | `GET /api/v1/governance/motions/comments?ids=...` | Avoids N+1 on list pages. Currently fetched per-card on expand. |
| ~~3~~ | ~~**Public resolutions page**~~ (`/transparency/resolutions`) | `GET /api/v1/transparency/resolutions?year=` | **Done** (2026-09-08) — `TransparencyResolutionsView.tsx` + `fetchTransparencyResolutions(year)`; see `governance-gap-list-top3.md` fold in HISTORY. |
| 4 | **Standalone member directory** | `GET /api/v1/governance/members` | Data fetched and shown in GovernanceView sidebar; no dedicated page. |
| ~~5~~ | ~~**Quarterly report download UI**~~ | `GET /api/v1/governance/quarterly-reports` | **Done** — `GovernanceView.tsx` already renders `report.downloadUrl` as a link on each report row (verified 2026-09-07; doc was stale). |

## Board admin gaps

| # | Gap | API endpoint | Notes |
| --- | --- | --- | --- |
| ~~6~~ | ~~**Meeting attendance management**~~ | `GET/POST /api/admin/governance/meetings/:id/attendance` | **Done** (2026-09-07) — `AttendancePanel` in the AGM tab; see `governance-gap-list-top3.md` fold in HISTORY. |
| 7 | **Governance audit log viewer** | `GET /api/admin/audit?scope=governance` | Paginated, topic/action/actor filters, secret ballot redaction, CSV export. Currently no dedicated viewer. |
| 8 | **Feature request quarterly report generation** | `POST /api/admin/feature-requests/reports` | Board generates markdown reports per quarter. No generate button or workflow. |
| 9 | **Feature request admin management** | `GET/PATCH /api/admin/feature-requests` | API client exists; `/admin/feature-requests` redirects to moderation tab instead of dedicated review panel. |
| 10 | **Meeting minutes upload** | `PATCH /api/admin/governance/meetings/:id` (with `minutesKey`) | Form fields exist but no file upload flow to MinIO. |

## Type/data gaps

| # | Gap | Notes |
| --- | --- | --- |
| ~~11~~ | ~~**Transparency resolution types**~~ | **Done** (2026-09-08) — reused `BoardResolution` (`tahti-web/src/api/types.ts`), superset of `TransparencyResolutionListSchema`'s fields. |
| ~~12~~ | ~~**Attendance types**~~ | **Done** (2026-09-07) — `GovernanceAttendanceItem`/`UpsertGovernanceAttendance` added to `api/types.ts`. |
| ~~13~~ | ~~**Motion detail description**~~ | **Done** (2026-09-08) — `GovernanceMotionDetail` type + `fetchGovernanceMotion(id)`. |

## UI/UX gaps

| # | Gap | Notes |
| --- | --- | --- |
| 14 | **Motion editing (board)** | Title/description editable on DRAFT via PATCH but no edit UI. |
| 15 | **Voting window adjustment** | Board can patch closeAt on drafts; no UI. |
| 16 | **Meeting detail view** | No standalone page showing full agenda, attendance, minutes, quorum. |
| ~~17~~ | ~~**Document preview/download**~~ | **Done** — `GovernanceView.tsx` already links `document.downloadUrl ?? document.externalUrl` on each document row (verified 2026-09-07; doc was stale). |
| 18 | **Cursor pagination** | Motions use cursor pagination but frontend fetches all at once. |

## Priority order

Top 3 (#1, #6, #3) shipped 2026-09-07/08 — see `governance-gap-list-top3.md`
fold in HISTORY. Remaining, in priority order:

1. Governance audit log viewer (#7)
2. Feature request admin management (#9)
3. Quarterly report generation (#8)

## Source

Generated 2026-09-06 from cross-referencing `../tahti-org` routes + DTOs against `packages/tahti-web/src/api/` and `src/views/`.

## Verification checklist

- [ ] Each gap confirmed against live API endpoints in `../tahti-org/apps/api/src/routes/`
- [ ] Check `packages/tahti-web/src/api/client.ts` and `admin.ts` for existing client functions
- [ ] Check `packages/tahti-web/src/api/types.ts` for missing type definitions
