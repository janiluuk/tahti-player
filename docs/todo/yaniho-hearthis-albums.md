# Yaniho: every hearthis.at album as its own album, ordered tracks

**Status:** partial

Requested 2026-11-22. Account: the Yaniho channel (`/channel/yaniho`).

## Wanted

1. Every hearthis.at album/Set of Yaniho is imported as its own Tahti album (release/collection), with the album name as on hearthis.at.
2. Track titles are only the track title: no artist prefix, album name, track number or file-name leftovers.
3. Each album has its own track index (1, 2, 3 ...) that says which track is first, second and so on, and the album page plays and lists in that order.
4. The order is manually sortable by the owner and by an admin (board).

## Progress (2026-11-22)

- tahti-org#1128 (deployed): every collection item has a dense 1..n `position` and a `trackNumber` in the owner, public and admin DTOs; removing or inserting renumbers; owner `PUT /api/me/collections/:slug/reorder`; board `GET /api/admin/collections/:slug` + `PUT /api/admin/collections/:slug/reorder` (audit `COLLECTION_ADMIN_REORDER`). New uploads get clean titles from file names (`@tahti/shared` track-title cleanup).
- Web: album rows show the track number before the title (`collectionTrackMeta` → `AmbientTrackRow` `trackNumber`); a board member gets "Sort tracks (board)" on any album page (`BoardCollectionSortSounds`, the same `SortSoundsDialog` the owner uses).
- Titles cleaned on production (tahti-org `clean-album-track-titles.ts yaniho`, HISTORY 2026-11-23). Left on purpose: older Hysterizer / Sisufuzz uploads still in Sets/Tracks. Left: 1:1 check against hearthis.at for covers/art.

## Where to look

- Import: sibling `janiluuk/tahti-cli` `tahti hearthis collection` / `release` (see [hearthis-collections-cli.md](hearthis-collections-cli.md), [hearthis-collection-live-run.md](hearthis-collection-live-run.md)). Set order is already used for adds; check how titles are derived and clean them.
- Track index: collection item `position` in `../tahti-org` collection routes / DTO; check that every album has a dense 1..n position and that tahti-web shows it.
- Sorting: Studio collection edit (`StudioCollectionEditView`) reorder for the owner; admin needs an equivalent route (tahti-org) and UI.
- Live data: audit production Yaniho albums against hearthis.at (needs credentials / the user's go-ahead for production writes).

## Done when

- A listing of hearthis.at Sets vs Tahti albums for Yaniho matches 1:1 by name and track count.
- Titles are clean; positions are 1..n per album; owner and admin can drag to reorder and the order persists.
