# UX sweep — batch 3 (30 empties)

**Status:** partial

One PR consolidates the next thirty bare-empty → `PageEmpty` micro-slices after the first ledger (`ux-sweep-30-slices`, folded) and the open `ux-b*` empties batch.

| # | Slice | File |
| - | ----- | ---- |
| 1–4 | Governance hub panels | `GovernanceView.tsx` |
| 5 | Member directory | `GovernanceMembersView.tsx` |
| 6 | Meeting agenda empty | `GovernanceMeetingDetailView.tsx` |
| 7–8 | AGM attendance + documents | `AgmTab.tsx` |
| 9 | Agenda items | `AgendaItemsPanel.tsx` |
| 10 | Quarterly FR reports | `FeatureRequestsTab.tsx` |
| 11 | Channel links | `ChannelViewBlocks.tsx` |
| 12 | Support ticket replies | `MySupportTickets.tsx` |
| 13 | Show recordings | `RecordingsTab.tsx` |
| 14 | Release track credits | `ReleaseTrackCreditsPanel.tsx` |
| 15 | Mixcloud import results | `MixcloudImportPanel.tsx` |
| 16 | Admin add-ons list | `AdminAddonsView.tsx` |
| 17 | Admin installs | `InstallsPanel.tsx` |
| 18 | Listen add-ons installed | `ListenAddonsPanel.tsx` |
| 19 | Radio show episodes | `RadioShowEpisodeList.tsx` |
| 20 | Shared track table empty | `PlayableTrackTable.tsx` |
| 21 | Catalog track search | `CatalogTrackSearch.tsx` |
| 22 | Collection details empty | `DetailsPanel.tsx` |
| 23 | Duplicate finder | `DuplicatesDialog.tsx` |
| 24 | Voting activity | `OverviewTab.tsx` |
| 25–26 | Elections empties | `ElectionsPanel.tsx` |
| 27 | Hearthis profile tab | `HearthisCard.tsx` |
| 28 | Stem jobs | `StemsPanel.tsx` |
| 29 | Mastering chain | `MasteringPanel.tsx` |
| 30 | (covered) PlayableTrackTable / RadioShowEpisodeList fan-out | shared |

Fold this file when the PR merges (#1259).

## Next candidates (from catalog sweep; not in #1259)

Bare empties / chips still worth a follow-on batch:

- `RadioView.tsx` — Nothing booked / No recent plays / No member sets
- `GovernanceView.tsx` — “No motions returned.”
- `AdminContentView.tsx` — curated content + recorded broadcasts
- `LibraryMediaView.tsx` — media empty
- `show-detail/EpisodesTab.tsx` + `OverviewTab.tsx` — episodes / upcoming slots
- `SelectsTab.tsx`, `ContentReportsTab.tsx`, `GrantsTab.tsx`
- `ChannelRotationEditor.tsx`, `PlayHistoryDialog.tsx`
- `AccountView.tsx` fan subscriptions; `RadioScheduleView.tsx`; `AdminLogsView.tsx`
- `go-live/MultistreamPanel.tsx` destinations
- `HistoryListSection.tsx` filter miss + clear
- `ChannelViewBlocks.tsx` link pills → `Badge`
- `ReleasesPanel.tsx` search miss + clear