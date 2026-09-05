# Governance: motion parity with tahti (apps/web) dashboard

**Status:** open

User compared `https://tahti.live/dashboard/governance/` (production
Next.js app, `tahti` repo) against tahti-player's `/governance`
(`GovernanceView.tsx`) and found the latter missing real functionality —
not just visual polish.

## Gap map

Audited both repos' full governance surface
(`apps/web/src/app/{dashboard/governance,governance}/**` vs
`packages/tahti-web/src/views/{GovernanceView,FeatureRequestsView,
admin/AdminGovernanceView}.tsx`).

**Already at parity, no action needed:**
- Feature requests / topics (`FeatureRequestsView.tsx`, 357 lines) — status
  badges, board review notes, duplicate-merge handling, comments, submit
  composer. As complete as apps/web's `feature-request-card.tsx`.
- Board-side governance tools (`AdminGovernanceView.tsx`) — member activity,
  board resolutions, links to venues/AGM/grants/reports/audit
  log/members. Broader than apps/web's board tooling in some respects
  (apps/web only has venue verification + a grant-preview dry-run panel
  here; tahti-player's admin area already covers all of that elsewhere).

**Real gaps, in `GovernanceView.tsx` (`/governance`), all in the Motions
list — apps/web's `motion-card.tsx` has these, tahti-player doesn't:**

1. **No DRAFT motion state handling.** apps/web shows a distinct "Discussion
   · 7-day circulation" badge + "Voting opens after circulation period
   (bylaws §9)" note for `state === 'DRAFT'`. tahti-player's `stateBadge()`
   only special-cases OPEN/CLOSED; DRAFT falls through to a generic orange
   badge with no explanation.
2. **No board motion-transition controls at all.** apps/web lets a board
   member open a DRAFT motion to voting, or close an OPEN one and publish
   the result, right from the motion card (`transitionMotion`,
   `PATCH /api/v1/governance/motions/:id` with `{ state }`). tahti-player
   has zero UI for this on `/governance` — board members have no way to
   advance a motion's lifecycle from the member-facing governance page.
3. **No turnout math.** apps/web shows "X of Y members voted" against
   `totalMembers` while a motion is open, and "X of Y voted · N% for" once
   closed. tahti-player already fetches `fetchGovernanceMembers()` for the
   member-directory panel but never uses `members.length` for turnout on
   motions — it only shows raw YES/NO/ABSTAIN counts.
4. **No quorum info on meetings.** `GovernanceMeeting` (in
   `api/types.ts`) already carries `attendanceCount`, `presentCount`,
   `eligibleMemberCount`, `quorumRequired`, `quorumMet` — the data is
   already fetched by `fetchGovernanceMeetings()`. The meetings panel in
   `GovernanceView.tsx` just doesn't render any of it, only title/date/state.

## Plan

- Add `patchGovernanceMotion(id, state)` to `api/client.ts`
  (`PATCH /api/v1/governance/motions/:id`), matching the existing
  `voteOnMotion`/`postMotionComment` pattern in that file.
- `GovernanceView.tsx`:
  - `stateBadge()`: distinct DRAFT badge + circulation-period copy.
  - Board-only (`hasAccountRole(user, 'BOARD')`) "Open voting" button on
    DRAFT motions, "Close & publish result" button on OPEN ones, wired to
    the new client function, refetching (`reload()`) on success.
  - Turnout line using `members.length` as the denominator, for both open
    (unvoted case) and closed (tally case) motions.
  - Meetings panel: render quorum met/not met + attendance/eligible counts
    when present.

Deliberately not touched: apps/web's exact CSS/copy (different design
systems — Nuclear/Tailwind here vs. `brand-*` classes there), the
board-tooling areas already covered elsewhere in tahti-player's Admin
section, and feature-requests (already at parity).

## Status

- [x] `patchGovernanceMotion` client function (`PATCH /api/v1/governance/motions/:id`)
- [x] DRAFT state badge + circulation-period copy
- [x] Board open/close motion controls (`isBoard` gated, `reload()`s on success)
- [x] Turnout math (open + closed motions), using `members.length`
- [x] Meeting quorum display (met/not met, present/eligible) — added a
      second (HELD/APPROVED) mock meeting to `governanceMocks.ts` since the
      only existing one was a not-yet-held AGM with `quorumMet: null`
- [x] Tests: new `GovernanceView.test.tsx` (6 cases, DRAFT copy, board
      controls visible/hidden by role, turnout text, quorum text) + full
      `tahti-web` suite green (445/445). Typecheck and lint clean.
- [ ] Push + deploy + verify live
