# Ambient + waveform track rows

**Status:** partial

## Goal

Listener/library track rows with cover-ambient wash and a scrubbable
waveform — comfortable (screenshot-like) and compact densities.

## Phase 1 (in progress)

- [x] `AmbientTrackRow` component (`comfortable` | `compact`)
- [x] Storybook `Tahti/Media/AmbientTrackRow` + deploy for review
- [ ] Wire after sign-off: all `PlayableTrackTable` surfaces + Library Tracks

Review:

- Comfortable: https://storybook.tahti.live/?path=/story/tahti-media-ambienttrackrow--comfortable
- Compact: https://storybook.tahti.live/?path=/story/tahti-media-ambienttrackrow--compact
- Stack: https://storybook.tahti.live/?path=/story/tahti-media-ambienttrackrow--stack

## Phase 2 (after review)

- Persist density (see `view-modes-track-tables.md`)
- Plumb `peaks` into list playables
- Upgrade Library `SoundRow` / expanded table mode
