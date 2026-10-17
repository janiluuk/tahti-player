# Batch 69 — board side of governance (twenty slices)

**Status:** partial

Asked for on 2026-10-17 ("do the next 20 slices and open pr"). Batch 68 gave members the governance records; this batch gives the board the screens to produce them. Every slice wires a tahti-org route that existed with no tahti-web caller (found with the reverse route diff over `/api/admin/*`). Web only; no tahti-org change was needed. Fold this file into HISTORY once the PRs merge.

## Slices

| # | Slice | PR |
| - | ----- | -- |
| 1 | Annual reports list shows each report's stage; no "Invalid Date" after generating (the generate answer is not a list row) | #1013 (merged) |
| 2 | Approve a report, optionally naming the meeting | #1014 |
| 3 | Publish an approved report to members (on #1014) | #1015 |
| 4 | Record / clear the filing with the register (on #1015) | #1016 |
| 5 | Correct an approved report; earlier versions (on #1016) | #1017 |
| 6 | Legal hold on a report (on #1017) | #1018 |
| 7 | Board tab: every board term | #1019 |
| 8 | Add a board term, with a member search that never shows emails (on #1019) | #1020 |
| 9 | End a board term early (on #1020) | #1021 |
| 10 | Elections: list and call one (on #1021) | #1022 |
| 11 | Edit or cancel an open election (on #1022) | #1023 |
| 12 | Candidates and nominating a member (on #1023) | #1024 |
| 13 | Record an election's result (on #1024) | #1025 |
| 14 | Records tab: members' correction requests (on #1019) | #1026 |
| 15 | Answer a correction request (on #1026) | #1027 |
| 16 | Association's registered details (on #1027) | #1028 |
| 17 | Auditors: list and add (on #1028) | #1029 |
| 18 | End an auditor's term (on #1029) | #1030 |
| 19 | One list of records on legal hold (on #1030) | #1031 |
| 20 | Fold batch 68, Admin Help text for the new tabs, tahti-web 0.0.165, this file | this PR |

## Merge order

Three stacks, bottom-up: #1014 → #1018; #1019 → #1025; #1026 → #1031 sits on #1019. tahti-player CI only runs on PRs into `master`, so a stacked PR shows no checks until its parent merges and it is retargeted.

## Left open

- Meeting agenda items (`/api/admin/governance/meetings/:id/agenda-items`, create/edit/order/delete) and motion result corrections (`/api/v1/governance/motions/:id/result-corrections`) still have no web UI.
- Legal holds on meetings, documents and resolutions are listed (#1031) but placed and released only through the API.
