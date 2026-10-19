# Replace hand-rolled chips/tabs and bare empty-state text

**Status:** partial

2026-10-19 sweep. Catalog components (`Badge`, `FilterChips`, `Tabs`, `EmptyState`,
`PageEmpty`) exist and are used broadly, but a set of surfaces still hand-roll the same
controls or render bare `<p>` empty text with no icon/CTA.

## Left after UX sweep

Empties + FilterChips/Badge/Tabs swaps landed in the UX sweep fold. Remaining: raw `<table>` surfaces (loading/empty/filtered) listed below.

## Hand-rolled controls

1. `RadioStationView.tsx:158` — hand-rolled toggle pill `rounded-full border px-3 py-1.5`
   where `FilterChips`/`SegmentedControl` fit.
2. `DirectoryArtistsBrowser.tsx:152-182` — two hand-styled pill buttons ("Active now",
   "Filters") duplicating `FilterChips` (the same file already uses it at `:184,198`).
3. `track-detail/TrackDetailsBlock.tsx:54` and
   `app-top-nav/ProcessingIndicator.tsx:15` — hand-rolled badges instead of `Badge`.
4. `channel-designer/HeaderStyleTabs.tsx:46` — hand-rolled `role="tab"` buttons instead of
   catalog `Tabs`.
5. Ten raw `<table>` elements bypassing any table component (no thead sort / loading /
   empty affordance): `HelpView.tsx:510`, `StatusView.tsx:76`,
   `TransparencyGrantYearView.tsx:54`, `TransparencyView.tsx:109,145,191`,
   `components/ReleasesPanel.tsx:151`, `studio/stats/DownloadGatesPanel.tsx:66`,
   `components/FanSubscriptionStats.tsx:122`, `components/PortInventoryPanel.tsx:65`,
   `admin/AdminGrantCycleView.tsx:147`. Re-statistic ones can stay raw but should get
   loading/empty/filtered states; list-like ones should move to a catalog table.

## Bare empty text → `EmptyState`/`PageEmpty`

Reference pattern with separate empty vs filtered-no-results + CTA:
`packages/player/src/views/Playlists/Playlists.tsx:45-62`.

- `GovernanceView.tsx:299` "No topics yet."
- `NewsView.tsx:157` "No announcements yet."
- `settings/MyRadioStations.tsx:143` "No stations yet. Add one with its stream URL."
- `studio/schedule/ScheduledTimes.tsx:69` "Nothing scheduled yet"
- `studio/branding/PressKitPreview.tsx:34` bio fallback
- `studio/distribution/CreditsEditor.tsx:25` "No credits yet — add writers…"
- `admin/governance/records/MemberRegisterPanel.tsx:77` "No member matches." (no
  clear-filters affordance)
- `studio/home/GovernanceSection.tsx:35` "Nothing waiting for your vote." +
  `SummaryStatsSection.tsx:52` "Nothing in your discography yet" (no CTA to first
  recording)
- `FeatureRequestsView.tsx:277` / `track-detail/TrackBody.tsx:92` "No comments yet." (no
  "be first" action)
- `MessagesView.tsx:294` inline "No messages yet" fallback
- `settings/SocialPostNow.tsx:166` "Nothing posted yet."
- `ListenView.tsx:86` `nothingFound: 'Nothing matches that filter.'` as plain text — add a
  "clear filter" button.

## Verify

- Storybook for anything new (story-first per AGENTS); catalog components already have
  stories.
- `pnpm --filter @tahti-player/tahti-web type-check && lint && test`; snapshot digest on the
  PR.
