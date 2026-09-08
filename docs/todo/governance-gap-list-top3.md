# Governance gap list: top 3 priority items + admin consolidation

**Status:** partial

Working the top 3 items from `governance-gap-list.md`'s "Priority order":
1. Motion detail view (#1, member-facing)
2. Meeting attendance management (#6, admin)
3. Public resolutions page (#3, member-facing)

Mid-task, the user also asked: while working on governance, remove plain
text cross-links between governance-adjacent admin pages and consolidate
every governance-related admin section under one "Governance" nav entry
with tab navigation (not separate top-level pages).

## Done

- **Admin consolidation.** `/admin/governance`, `/admin/reports`,
  `/admin/grants` (bare), `/admin/agm` used to be four separate
  `AdminNav` entries/pages. Now one `/admin/governance` page
  (`AdminGovernanceView.tsx`, mirrors `AdminModerationView`'s tab-container
  pattern) with tabs Overview/Annual reports/Grants/AGM
  (`views/admin/governance/{governanceNav.ts,tabs/*.tsx}`). Old routes
  redirect into `/admin/governance/$tab` (same convention as
  `/admin/moderation/$tab`). `/admin/grants/$year` (a specific cycle,
  `AdminGrantCycleView.tsx`) is untouched — still its own deep route,
  now linked from the Grants tab and back again via
  `/admin/governance/$tab`. Removed the "Governance overview" plain-text
  links that used to sit at the top of the Reports/Grants/AGM pages —
  redundant now that they're tabs of the same page. `AdminNav.tsx`'s
  PRIMARY list and the "Community" section's `SectionTabs` row now show
  only "Governance", not the other three. Deleted the three old
  standalone view files and their Storybook stories (folded into
  `AdminGovernanceView.stories.tsx`'s per-tab exports, matching
  `AdminModerationView.stories.tsx`'s convention).
  - Fixed `e2e/real-user-journeys.spec.ts`'s "governance navigation..."
    test, which asserted `/admin/agm` lit an "AGM" tab directly in the
    `Admin Community` tablist — that tab no longer exists there (it's
    now inside the inner `Governance sections` tablist). Updated the
    assertion accordingly. Verified via a throwaway e2e script
    (`VITE_FORCE_MOCK=1` local dev server) that all four
    `/admin/governance*` entry points redirect correctly and light the
    right tab, and that `Admin Community` no longer has stray
    Reports/Grants/AGM tabs — full pass. Not otherwise re-verified:
    `test-runner`/full e2e suite (not run — expensive; targeted
    verification only).
  - `mapScreens.ts` (screen-atlas content, not app UI) still has
    `admin-agm`/goesTo entries referencing `/admin/agm` etc. directly —
    left as-is, still functionally correct via redirect, and it's
    documentation of historical screenshots rather than live nav; not
    worth the churn for this pass.
- **Gap #6 — meeting attendance management.** Added
  `GovernanceAttendanceItem`/`UpsertGovernanceAttendance` types
  (`api/types.ts`) and `fetchAdminGovernanceAttendance` /
  `upsertAdminGovernanceAttendance` (`api/admin.ts`), matching
  `../tahti-org`'s `GET/POST /api/admin/governance/meetings/:id/attendance`
  exactly (`GovernanceAttendanceItemSchema`/`UpsertGovernanceAttendanceSchema`
  in `packages/shared/src/dto/governance.ts`). UI lives in the AGM tab's
  `AttendancePanel` (`governance/tabs/AgmTab.tsx`) — expandable per
  meeting, lists recorded attendance (name + status badge), and a
  name + status form to record new entries.
  - **Known limitation, by design, not a bug:** the backend only
    upserts by `memberId`, and this admin UI has no clean way to
    resolve a member's real id from the member-list APIs available to
    the frontend (`GovernanceMemberViewSchema` only exposes
    `memberNumber`/`displayName`/`username`, not the DB id). So
    attendance is recorded by free-text display name
    (`memberId` omitted) — realistic "board secretary roll call by
    name" workflow, fully supported by the schema (`memberId` is
    `nullable().optional()`), but re-recording the same name adds a
    new row rather than editing the existing one (no PATCH-by-id route
    exists server-side to correct this). Documented in a code comment;
    not something to silently paper over on the frontend.
  - Not live-verified end to end: this admin session's local mock dev
    server has no seeded meetings (`fetchAdminGovernanceMeetings` isn't
    mocked, hits a real API path that doesn't exist locally, so the
    meeting list — and therefore any attendance panel — is empty in
    that environment). Verified the surrounding nav/tab behavior
    instead; the attendance code itself is type-checked, lint-clean,
    and a straight mirror of the sibling `patchAdminGovernanceMeeting`
    pattern already proven live in production.

## Remaining

- [x] Gap #1 — motion detail view (member-facing `/governance`),
      **2026-09-08**. Added `fetchGovernanceMotion(id)` (`api/client.ts`,
      hits `GET /api/v1/governance/motions/:id`, mock branch keyed off
      `mockMotions` + a new `mockMotionDescriptions` map) and a
      `GovernanceMotionDetail = GovernanceMotion & { description: string }`
      type (`api/types.ts`), matching the backend's `MotionDetailSchema`.
      Extracted the list's per-motion card (badge, tally, vote buttons,
      board open/close controls, discussion thread) out of
      `GovernanceView.tsx` into `components/governance/MotionCard.tsx` —
      now self-contained (owns its own expanded/comments/voting/
      transitioning state instead of being lifted to the list), taking an
      optional `description` prop (only the detail page passes one) and a
      `linkTitle` prop (only the list passes it, wrapping the title in a
      `Link` to the detail route). New `GovernanceMotionDetailView.tsx`
      fetches the single motion + member count, renders the same
      `MotionCard` with `defaultExpanded` and the description filled in,
      with its own loading/forbidden/not-found states mirroring
      `GovernanceView.tsx`'s pattern. New route
      `/governance/motions/$id` in `router.tsx`. All 6 existing
      `GovernanceView.test.tsx` tests still pass unchanged (card
      extraction preserved behavior); added
      `GovernanceMotionDetailView.test.tsx` (2 tests: title+description+
      expanded discussion, not-found id). `tsc --noEmit`, `eslint`,
      `pnpm vitest run` all pass. Not live-browser-verified.
- [ ] Gap #3 — public resolutions page (`/transparency/resolutions`).
      Backend: `GET /api/v1/transparency/resolutions?year=`. Admin-side
      resolution creation/publishing already exists
      (`createAdminResolution`/`fetchAdminResolutions`/
      `patchAdminResolution` in `api/admin.ts`, used by the Governance
      Overview tab) — this gap is purely the missing public listing
      page for members to actually see published resolutions.
      `TransparencyView.tsx` shows grants/ledger but not resolutions.
