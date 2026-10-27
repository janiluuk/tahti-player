# UX batch 112 — forty polish slices

**Status:** open

Forty small tahti-web polish slices after merging open batch-90 PRs
(#1605–#1638). One focused change each; library components only; no new APIs.

## Ambient track lists (1–5)

- [x] 1 Channel pinned → `PlayableAmbientTrackList`
- [x] 2 Channel catalog tracks → `PlayableAmbientTrackList`
- [ ] 3 Tag search → `PlayableAmbientTrackList` — skipped: `SearchTrackResult` has no stream URL, so a `TahtiPlayable` can't play; needs a sibling contract or resolver
- [x] 4 Listener widget playlist → `PlayableAmbientTrackList`
- [ ] 5 Search results tracks → `PlayableAmbientTrackList` — skipped: same as 3 (`/api/v1/search` tracks carry no stream URL)

## Undo toasts (6–12)

- [x] 6 Studio playlists create undo
- [x] 7 Save queue → cloud playlist undo
- [x] 8 Add-to-playlist new playlist undo
- [x] 9 Hearthis create-collection undo — new-playlist destination only; import-as-collection path keeps its "Open collection" toast (undo would orphan imported sounds)
- [x] 10 Radio inline playlist undo
- [x] 11 Editor session create undo
- [x] 12 Save queue → local playlist undo

## De-green (13–20)

- [x] 13 Feature requests composer Cancel secondary
- [x] 14 Spotify import row Add secondary
- [x] 15 Studio shows empty New show secondary
- [x] 16 Client logs Clear/Export secondary
- [x] 17 Remove widget confirm secondary + danger
- [x] 18 Studio SoundRow play secondary
- [x] 19 Studio ambient hosted play secondary (already secondary via AmbientTrackRow)
- [x] 20 Updates empty Write a post secondary

## Empty / error (21–28)

- [x] 21 Jam → PageEmpty
- [x] 22 Stash empty → PageEmpty
- [x] 23 Collection editor tracklist empty → PageEmpty
- [x] 24 Spotify import no results → PageEmpty
- [x] 25 Studio shows empties → PageEmpty
- [x] 26 Distribution index empty → PageEmpty
- [x] 27 Listener widget errors → InlineError
- [x] 28 Channel live shows empty (public) → PageEmpty

## Search keyboard (29–35)

- [x] 29 Genre combobox search hints
- [x] 30 Subgenre/TagChipInput search hints
- [x] 31 Radio Browser search hints
- [x] 32 Spotify track search type=search
- [x] 33 Release library picker search
- [x] 34 Hearthis search hints
- [x] 35 Disco widget search type=search

## Usability / shared (36–40)

- [x] 36 Zero catalog methods standing hint
- [x] 37 Missing DSP URLs InlineError
- [x] 38 Notifications actionError → InlineError
- [x] 39 Studio sounds list memo vs progress ticks
- [x] 40 Artist release/playlist grid empties
