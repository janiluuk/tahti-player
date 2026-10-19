# UX sweep — batch 4 candidates

**Status:** open

Follow-on after #1259 (batch 3). Catalog research leftovers still bare:

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

Prefer one PR or per-slice PRs when picking this up; skip surfaces already covered by open `ux-b*` PRs.
