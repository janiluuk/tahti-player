# Ambient + waveform track rows

**Status:** partial

## Goal

Listener/library track rows with cover-ambient wash and a scrubbable
waveform — comfortable / compact / dense densities via a top size control.

## Done

- [x] `AmbientTrackRow` (comfortable | compact | dense)
- [x] `AmbientTrackList` listing widget + size SegmentedControl (persisted)
- [x] Storybook `Tahti/Media/AmbientTrackRow` + `AmbientTrackList`
- [x] Library → Sounds uses `SoundsAmbientList` (ambient rows + size control)

## Left

- Wire other PlayableTrackTable surfaces (Listen, Favorites, Collections, …)
- Prefer real `peaks` from list API when present (mock peaks fallback today)
