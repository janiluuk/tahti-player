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
| ~~7~~ | ~~**Governance audit log viewer**~~ | `GET /api/admin/audit?scope=governance` | **Mostly stale claim, corrected 2026-09-08** — `/admin/logs`'s "Audit events" tab (`AdminActivityView.tsx`) already is a paginated (`page`/`limit`/`total` tracked), filterable (search/date-range/level/scope client-side over the fetched page; server-side `action`/`actorId`/`since`/`until`), redaction-safe (redaction is server-side in `presentAuditLogRow`, not a frontend concern) audit viewer with a CSV export link. Found and fixed one real bug while verifying this: neither the fetch nor the CSV link passed `scope=all`, so the backend's `scope` default (`'governance'`, which deliberately excludes login/like/chat "ops noise" per its own doc comment) was silently narrowing this general activity feed to governance-only actions, and "Export full audit log as CSV" was quietly exporting a governance-only subset. Fixed both in `admin.ts` (`fetchAdminActivity` now defaults `scope: 'all'`; `adminActivityExportCsvUrl()` appends `?scope=all`). Still genuinely missing: a UI control for the `topic` filter (only usable via URL/query today) and a real "next page" control (`total` is tracked but the UI just shows a flat window). |
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
| ~~16~~ | ~~**Meeting detail view**~~ | **Done** (2026-09-08) — `GovernanceMeetingDetailView.tsx` at `/governance/meetings/$id` (type, state, scheduled time, location/remote link, notice date, minutes status, quorum, present/eligible counts, full agenda), linked from each meeting title in `GovernanceView.tsx`. No new fetch needed — `fetchGovernanceMeetings()` already returns every field; the "gap" was the missing standalone page, not missing data. |
| ~~17~~ | ~~**Document preview/download**~~ | **Done** — `GovernanceView.tsx` already links `document.downloadUrl ?? document.externalUrl` on each document row (verified 2026-09-07; doc was stale). |
| 18 | **Cursor pagination** | Motions use cursor pagination but frontend fetches all at once. |

## Priority order

Shipped 2026-09-07/08: #1, #3, #4, #6, #7 (mostly already built — fixed a
real `scope=all` bug), #8, #9 (corrected — already done, not a code
change), #14, #16, plus type gaps #11–#13. Remaining:

- Bulk motion comments (#2) — perf-only, changes UX (bulk-prefetch vs.
  today's fetch-on-expand); not attempted, needs a product call on the
  tradeoff, not just a code change.
- Meeting minutes upload (#10) — real gap, but needs new backend upload
  infrastructure in `../tahti-org` first (no generic document-upload
  presign route exists to reuse; the audio-specific `/api/uploads/*`
  pair doesn't fit). Not attempted without being asked to touch that
  repo for something this size.
- Cursor pagination (#18) — perf-only, lowest priority.
- Voting window adjustment (#15) — blocked on a backend schema change
  (`closeAt` isn't patchable server-side today), not just a frontend gap.
- Audit log topic-filter UI + real pagination controls (#7's residue,
  see its row above) — small, not attempted this pass.

## Source

Generated 2026-09-06 from cross-referencing `../tahti-org` routes + DTOs against `packages/tahti-web/src/api/` and `src/views/`.

## Verification checklist

- [ ] Each gap confirmed against live API endpoints in `../tahti-org/apps/api/src/routes/`
- [ ] Check `packages/tahti-web/src/api/client.ts` and `admin.ts` for existing client functions
- [ ] Check `packages/tahti-web/src/api/types.ts` for missing type definitions
