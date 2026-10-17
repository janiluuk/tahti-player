# Batch 68 — twenty cross-repo slices

**Status:** partial

Asked for on 2026-10-17 ("next 15 slices of cross repo todo", then "rebase to latest master and do next 20 slices of work, make pr"). Batch 67 was already merged and folded, so this is a new batch. The old cross-repo leftovers (chat, blocks, jams, reactions) turned out fixed by earlier batches; a reverse route diff (tahti-org routes with no tahti-web caller) and a read of the thin-tested org areas found the work below. All PRs are open for review; fold this file into HISTORY once they merge.

## Slices

| # | Repo | Slice | PR |
| - | ---- | ----- | -- |
| 1 | tahti-org | Booking a venue show checks the channel is yours and that it ends after it starts | tahti-org#848 |
| 2 | tahti-org | A show that is on now stays on the venue page, calendar feed and owner's list | tahti-org#849 |
| 3 | tahti-org | Venue calendar feed is valid iCalendar (DTSTAMP, escaping, folding) | tahti-org#850 |
| 4 | tahti-org | A venue's owner can cancel a show booked at the venue | tahti-org#851 |
| 5 | tahti-org | Theme gallery: fetch timeout, a registry outage is not cached | tahti-org#852 |
| 6 | web | Governance: current board | #998 |
| 7 | web | Governance: board elections and candidates (on #998) | #999 |
| 8 | web | Governance: stand for election / withdraw (on #999) | #1000 |
| 9 | web | Governance: published annual reports (on #1000) | #1001 |
| 10 | web | Governance: association details and auditors (on #1001) | #1002 |
| 11 | web | Governance: request a correction (on #1002) | #1003 |
| 12 | web | Governance: withdraw a waiting correction (on #1003) | #1004 |
| 13 | web | My venues page `/venues/mine` | #1005 |
| 14 | web | My venues: edit details (on #1005) | #1006 |
| 15 | web | My venues: list and book shows (on #1006) | #1007 |
| 16 | web | My venues: cancel a show (on #1007) | #1008 |
| 17 | web | Venue page marks a show that is on now | #1009 |
| 18 | web | Links into My venues; `/studio/venues` goes there, not to Admin (on #1008) | #1010 |
| 19 | docs | Fold `sweep-leftovers.md` (tahti-org#834 deployed) | #1011 |
| 20 | web + docs | Help text for the new member and venue features, tahti-web 0.0.164, this file | this PR |

## Merge order

tahti-org PRs are independent of each other (#848-#851 all edit `routes/venues/venues.ts` in different places). Web chains: #998 → #1004 and #1005 → #1008 → #1010 land bottom-up (rebase each child onto `master` after its parent squash-merges). #1009, #1011 and this PR are off `master`. #1009 and #1008/#1011 work without the org PRs, but a live show only appears once tahti-org#849 is deployed, and an owner cancelling another artist's booking needs tahti-org#851.

## Found but not done

- tahti-org `fansubs/payouts` CSV and `/api/me/channel-funnel-stats`: checked, already covered in the web (CSV export link; funnel data served by the gate and live routes).
- `/api/v1/custom-domain/resolve`, `/api/smartlink/click`, OAuth callbacks and `og/*` have no tahti-web caller on purpose (server or nginx side).
- Board side of elections, board terms, auditors and annual reports still has no admin UI in tahti-web (`/api/admin/governance/elections`, `board-terms`, `auditors`, `/api/admin/reports/annual`). Next candidate batch.
