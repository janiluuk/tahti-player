# AmbientTrackList mobile defaults

**Status:** open

## Goal

On phones, listings that use `AmbientTrackList` / `PlayableAmbientTrackList`
should default to **list** view (table), with a more compact row treatment
and readable cover art. Today mobile only reflows CSS — it never forces a
view; stored Large/Medium/Small/`grid` applies the same as desktop, so mixed
densities look misaligned and art reads too small.

## Audit (2026-11-05)

- Shared picker: `TrackViewPicker` + `trackListViewStore` (`tahti.ambientTrackList.density`).
- `PlayableAmbientTrackList` default: `compact` + `allowGrid`; List via `PlayableTrackTable`.
- No `useIsMobile` / matchMedia override on these widgets.
- Density art: comfortable `112→176→224`, compact `96→160`, dense fixed `64`.
- `CardsRow` already defaults to list on mobile (shipped 0.0.343) — mirror that pattern here.

## Plan

- [ ] When viewport is phone and no explicit stored/controlled view, resolve to `list` (if `renderList`) else `dense`/`compact`
- [ ] Do not overwrite a user-picked stored desktop view blindly — prefer: first visit / null store → mobile list; optional “mobile prefers list unless user picked on this device”
- [ ] Tighten `AmbientTrackRow` phone layout (alignment across densities, larger thumb than current wrap)
- [ ] Stories: `PhoneWidth` asserts list default; unit tests for view resolution
- [ ] Consumers stay on the shared widget (Listen, Favorites, Search, Collections, channel, artist, local files)

## Out of scope

- Discover `WidgetTrackRow` (fixed thumb)
- Studio schedule `SegmentedControl` cards/list
