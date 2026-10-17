# Batch 70 — meeting records and motion actions (twenty slices)

**Status:** partial

Asked for on 2026-10-17 ("do the next 20 slices and open pr"). Continues batch 69's method: tahti-org governance routes with no tahti-web caller, found with the reverse route diff. Web only. Fold into HISTORY once the PRs merge.

## Slices

| # | Slice | PR |
| - | ----- | -- |
| 1 | Admin: a meeting's agenda items | #1034 |
| 2 | Add an agenda item (on #1034) | #1035 |
| 3 | Edit an item and record its outcome (on #1035) | #1036 |
| 4 | Remove an item (on #1036) | #1037 |
| 5 | Reorder the agenda (on #1037) | #1038 |
| 6 | Remove a conflict declaration recorded by mistake | #1039 |
| 7 | Members: the meeting page's agenda items, outcomes and filed records | #1040 |
| 8 | Members: conflicts of interest on the meeting page (on #1040) | #1041 |
| 9 | A closed motion's result certificate | #1042 |
| 10 | Board: append a correction to a motion's result (on #1042) | #1043 |
| 11 | Board: circulate a draft for seconds (on #1043) | #1044 |
| 12 | Board: put a motion on a meeting (on #1044) | #1045 |
| 13 | Board: file a motion under an agenda item (on #1045, contains #1040) | #1046 |
| 14 | Legal hold on a meeting, shared hold control | #1047 |
| 15 | Legal hold on a document (on #1047) | #1048 |
| 16 | Legal hold on a resolution (on #1048) | #1049 |
| 17 | Archive, restore and rename a document (on #1049) | #1050 |
| 18 | A circulated draft says so (on #1046) | #1051 |
| 19 | Searchable member register in the AGM tab | #1052 |
| 20 | Fold batch 69, admin Help text, tahti-web version bump, this file | this PR |

## Merge order

Off master: #1034, #1039, #1040, #1042, #1047, #1052 and this PR. Stacks bottom-up: #1035 → #1038 on #1034; #1041 on #1040; #1043 → #1046 → #1051 on #1042 (merge #1040 before #1046, which contains it); #1048 → #1050 on #1047.

## Left open

- The board still cannot edit a meeting's other fields (location, notice day) from the AGM tab beyond what it already had; not checked in this batch.
- Linking documents and resolutions to an agenda item (`agendaItemId` on their PATCH) has no picker yet.
