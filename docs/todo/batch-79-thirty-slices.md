# Batch 79 — thirty UX / beta-launch slices

**Status:** open

Asked for as "pull the latest branch, continue on project todo, implement 30 slices".
Picks the next concrete frontend work from `beta-launch-findings.md`,
`ux-backlog.md`, and `studio-usability-audit.md`. Ops / product-call /
blocked-on-org items stay in those files.

## Already on master (mark done in beta findings, not re-done here)

- Mixcloud-embed connect probe skipped (#1417)
- Channel stage says rotation, not live (#1418)
- Account menu says Studio / My artist profile (#1419)
- Queue rows named; buttons only when reorderable (#1420)
- Collections list row menu (`StudioCollectionMoreMenu`)
- Channel designer "Open my channel" link
- Feature-request comments / Governance motions → `PageEmpty`
- ProcessingIndicator already uses `Badge`
- History row active accent (`data-active` + yellow border)
- Sounds ambient rows already have aria-labels + tooltips
- Empty queue starts collapsed (layoutStore v8)

## Slices (target ~30)

### Beta launch — artist / listener

1. [x] New ALBUM/EP collections default to private (draft) until published
2. [x] Create release POST sends `state: 'DRAFT'` (not only mock)
3. [x] Collections list: one label — "Edit" (drop Design/Edit split)
4. [x] After delete from collection editor, land on `/library/collections`
5. [x] Auto-collapse the right rail when the queue becomes empty in Studio/Library
6. [x] Own channel track table: hide Artist when every row is the channel owner
7. [x] Library section tabs: keep a single scrollable row at 1440 / phone
8. [x] History empty copy: say plays count after ~30 s (or half the track)
9. [x] Favorites channel cards: denser phone grid (2+ per row)
10. [x] MusicBrainz "Don't ask again" re-enable toggle in Settings → Artist → Connections
11. [x] Soften signed-out `/api/auth/me` 401 so it is not a console.error noise path

### UX backlog / studio usability

12. [x] Upstream `ConfirmDialog` to `@tahti-player/ui`
13. [x] `StatChip` optional `onClick` / button semantics
14. [x] `PublicGovernanceHistoryView` back link → `/governance`
15. [x] Settings redirect tab label Money → Revenue
16. [x] `ReleasesPanel` filtered-empty + clear
17. [x] `ArtistReferenceSections` use catalog `SectionTitle`
18. [x] Header designer style picker uses catalog `Tabs` where practical
19. [x] Download gates panel: loading / empty via shared empty helpers
20. [x] Play controls show loading while `status === 'loading'` on list MediaArtwork
21–30. [x] Doc hygiene: tick fixed beta findings; INDEX row; fold notes as slices land

## Out of scope this batch

Domain switch, Tahti Radio HLS, #879 prod, beta seed cleanup, Google Drive
Picker, channel add-on block layout, Sign-in → Studio product call, release
DELETE (needs org route), Player "Try again" (AudioEngine), auth rate-limit
verify after deploy.
