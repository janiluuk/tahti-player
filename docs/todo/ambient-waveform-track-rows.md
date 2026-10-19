# Ambient + waveform track rows

**Status:** partial

## Goal

Listener/library track rows with cover-ambient wash and a scrubbable
waveform — comfortable (screenshot-like) and compact densities.

## Phase 1 (in progress)

- [x] `AmbientTrackRow` component (`comfortable` | `compact`)
- [ ] Storybook `Tahti/Media/AmbientTrackRow` + deploy for review
- [ ] Wire after sign-off: all `PlayableTrackTable` surfaces + Library Tracks

## Phase 2 (after review)

- Persist density (see `view-modes-track-tables.md`)
- Plumb `peaks` into list playables
- Upgrade Library `SoundRow` / expanded table mode
