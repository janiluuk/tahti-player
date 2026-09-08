# Governance gap list: tahti-player vs tahti-org

**Status:** open

Gap analysis of governance features available in the sibling API (`../tahti-org`) but missing or incomplete in `tahti-player` / `tahti-web`.

## Member-facing gaps

| # | Gap | API endpoint | Notes |
| --- | --- | --- | --- |
| ~~1~~ | ~~**Motion detail view**~~ (`/governance/motions/:id`) | `GET /api/v1/governance/motions/:id` | **Done** (2026-09-08) — `GovernanceMotionDetailView.tsx` + `fetchGovernanceMotion(id)`; see `governance-gap-list-top3.md` fold in HISTORY. |
| 2 | **Bulk motion comments** | `GET /api/v1/governance/motions/comments?ids=...` | Avoids N+1 on list pages. Currently fetched per-card on expand. |
| ~~3~~ | ~~**Public resolutions page**~~ (`/transparency/resolutions`) | `GET /api/v1/transparency/resolutions?year=` | **Done** (2026-09-08) — `TransparencyResolutionsView.tsx` + `fetchTransparencyResolutions(year)`; see `governance-gap-list-top3.md` fold in HISTORY. |
| ~~4~~ | ~~**Standalone member directory**~~ | `GET /api/v1/governance/members` | **Done** (2026-09-08) — `GovernanceMembersView.tsx` at `/governance/members` (search by name/username, board badge), linked from `GovernanceView.tsx`'s inline preview. |
| ~~5~~ | ~~**Quarterly report download UI**~~ | `GET /api/v1/governance/quarterly-reports` | **Done** — `GovernanceView.tsx` already renders `report.downloadUrl` as a link on each report row (verified 2026-09-07; doc was stale). |

## Board admin gaps

| # | Gap | API endpoint | Notes |
| --- | --- | --- | --- |
| ~~6~~ | ~~**Meeting attendance management**~~ | `GET/POST /api/admin/governance/meetings/:id/attendance` | **Done** (2026-09-07) — `AttendancePanel` in the AGM tab; see `governance-gap-list-top3.md` fold in HISTORY. |
| 7 | **Governance audit log viewer** | `GET /api/admin/audit?scope=governance` | Paginated, topic/action/actor filters, secret ballot redaction, CSV export. Currently no dedicated viewer. |
| ~~8~~ | ~~**Feature request quarterly report generation**~~ | `POST /api/admin/feature-requests/reports` | **Done** (2026-09-08) — `QuarterlyReportsPanel` in `FeatureRequestsTab.tsx` (`/admin/moderation/feature-requests`): lists generated reports + a "Generate current quarter report" button wired to `generateFeatureRequestQuarterlyReport()`. |
| ~~9~~ | ~~**Feature request admin management**~~ | `GET/PATCH /api/admin/feature-requests` | **Stale claim, corrected 2026-09-08** — `/admin/feature-requests` does redirect, but to `FeatureRequestsTab.tsx` (`/admin/moderation/feature-requests`), which already *is* a full dedicated review panel: status filter tabs (Open/Planned/In progress/Done/Declined), vote counts, and Plan/In progress/Done/Decline/Reopen actions per row. Verified by reading the component, not a guess. |
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
| ~~14~~ | ~~**Motion editing (board)**~~ | **Done** (2026-09-08) — "Edit motion" toggle in `MotionCard.tsx` (board + DRAFT only, on the detail page where the description is loaded), title `Input` + description `textarea`, `patchGovernanceMotion(id, { title, description })`. |
| 15 | **Voting window adjustment** | **Premise corrected 2026-09-08**: checked `PatchMotionSchema` in `../tahti-org` (`packages/shared/src/dto/governance.ts`) — it only accepts `state`/`title`/`description`, no `closeAt` field at all. "Board can patch closeAt on drafts" is false as written; this would need new backend schema + route work first, not just a frontend UI. |
| 16 | **Meeting detail view** | No standalone page showing full agenda, attendance, minutes, quorum. |
| ~~17~~ | ~~**Document preview/download**~~ | **Done** — `GovernanceView.tsx` already links `document.downloadUrl ?? document.externalUrl` on each document row (verified 2026-09-07; doc was stale). |
| 18 | **Cursor pagination** | Motions use cursor pagination but frontend fetches all at once. |

## Priority order

Shipped 2026-09-07/08: #1, #3, #6 (see `governance-gap-list-top3.md` fold
in HISTORY), #4, #8, #9 (corrected — already done, not a code change),
#14, plus type gaps #11–#13. Remaining, unordered (no more explicit
priority ranking — the original top-3 list is exhausted):

- Governance audit log viewer (#7)
- Bulk motion comments (#2)
- Meeting minutes upload (#10)
- Meeting detail view (#16)
- Cursor pagination (#18)
- Voting window adjustment (#15) — blocked on a backend schema change
  (`closeAt` isn't patchable server-side today), not just a frontend gap.

## Source

Generated 2026-09-06 from cross-referencing `../tahti-org` routes + DTOs against `packages/tahti-web/src/api/` and `src/views/`.

## Verification checklist

- [ ] Each gap confirmed against live API endpoints in `../tahti-org/apps/api/src/routes/`
- [ ] Check `packages/tahti-web/src/api/client.ts` and `admin.ts` for existing client functions
- [ ] Check `packages/tahti-web/src/api/types.ts` for missing type definitions
