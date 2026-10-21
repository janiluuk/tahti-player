# Batch 88 — thirty wavesurfer.js migration slices

**Status:** open

User: "continue with todo for 30 slices, go with the waveform migration"
(unblocks [wavesurfer-waveforms.md](wavesurfer-waveforms.md)).

## Decisions locked for this batch

- Previews: large only (hero, Studio sound header, edit dialog). Ambient rows
  keep canvas / ambient.
- Peaks: stored `[0..255]` for previews; editor may decode.
- Playback: wavesurfer draws + seeks; bound to global player `<audio>`.
- Look: rounded mirrored bars; progress `--primary`.
- Editor plugins: Regions, Timeline, Minimap, Zoom, Hover (no Envelope /
  Spectrogram / Record).
- Desktop: deferred.
- Old code: keep ambient + player-bar seekbar; ProWaveform fallback.

## Slices

### Foundation (~12)

1. [x] Add `wavesurfer.js` to `@tahti-player/ui`
2. [x] `peaksToWaveSurfer` — `[0..255]` → channel float peaks `-1..1`
3. [x] `Waveform` component — container, lazy create/destroy
4. [x] Theme: wave/progress/cursor from CSS variables
5. [x] Look: `barWidth` / `barGap` / `barRadius` + bipolar peaks
6. [x] Props: `peaks`, `durationSec`, `media?`, `progress?`, `onSeek?`
7. [x] Sync progress when not using media (setTime)
8. [x] Seek click → `onSeek` / media
9. [x] Empty / no-peaks placeholder
10. [x] Unit tests for peaks helper + Waveform mount
11. [x] Storybook: peaks / empty / seeking
12. [x] Export from `packages/ui` index

### Player bind + large previews (~10)

13. [x] `playerStore` register global `HTMLAudioElement`
14. [x] `AudioEngine` registers/unregisters audio ref
15. [x] `PlayerWaveform` wrapper in tahti-web
16. [x] Migrate `TrackHero` → PlayerWaveform
17. [x] Migrate `SoundHeader` → PlayerWaveform
18. [x] Migrate track-edit `AudioTab`
19. [x] Keep player-bar `WaveformSeekbar`
20. [x] Keep ambient / `WaveformCanvas` list rows
21. [x] AudioTab tests updated
22. [x] Dynamic import of wavesurfer in Waveform / EditorWaveSurfer

### Editor shell (~8)

23. [x] `EditorWaveSurfer` + Regions
24. [x] Timeline + Minimap + Zoom + Hover plugins
25. [x] Selection region ↔ editor selection API
26. [x] Wire into `WaveformEditor` with ProWaveform fallback
27. [x] Decode / peaks via existing `useWaveformData`
28. [x] Fallback on init failure
29. [x] Docs: wavesurfer todo partial; INDEX; bump ui + tahti-web
30. [x] Worklog; type-check + targeted tests

## Out of scope

Desktop native library waveforms, Envelope/Spectrogram/Record, deleting
`ProWaveform` entirely, ambient list migration, new peaks API.
