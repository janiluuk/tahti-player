# Waveforms with wavesurfer.js (audio editor + previews)

**Status:** partial — batch 88 implements foundation + large previews + editor
shell; desktop / full ProWaveform deletion remain.

Requested 2026-10-21: integrate [wavesurfer.js](https://github.com/katspaugh/wavesurfer.js)
([wavesurfer.xyz](https://wavesurfer.xyz/)) and use it for the waveforms in the
audio editor and in previews. Unblocked 2026-10-21 (“go with the waveform
migration”).

## Today

- **Studio pro editor** (`views/studio/pro-editor/`): hand-written canvas
  waveform `waveform/ProWaveform.tsx` + `ProMinimap.tsx`, peaks in
  `waveform/peaks.ts`, zoom / pan in `waveform/viewMath.ts`, regions in
  `RegionList.tsx`, toolbar `WaveformToolbar.tsx`, editor shell
  `WaveformEditor.tsx` (trim etc.).
- **Previews**: `components/WaveformCanvas.tsx`, `WaveformMinimap.tsx`,
  `tahti/WaveformSeekbar.tsx` (player bar / seek), `AmbientTrackRow.tsx`
  (Library, Collections, Favorites rows; falls back to mock peaks when a
  track has none), `views/track-detail/TrackHero.tsx`, Studio
  `sound/SoundHeader.tsx`, `track-edit-dialog/AudioTab.tsx`.
- **Peaks data**: tahti-org stores `peaks Json?` as `[0..255]` amplitude
  buckets cached at transcode time (Sound and the set / episode models), so
  previews need no audio decode today.

## Plan (after the decisions)

1. Add `wavesurfer.js` (BSD-3-Clause, compatible with AGPL) to
   `@tahti-player/ui` behind one `Waveform` component with Storybook stories,
   theme tokens for colours, and a lazy chunk so pages without a waveform
   don't pay for it.
2. Editor: wavesurfer + Regions (trim / cut / fade regions), Timeline,
   Minimap and Zoom plugins replace `ProWaveform` / `ProMinimap` / the
   hand-rolled zoom math; keep the existing editor actions and keyboard
   shortcuts.
3. Previews: swap the chosen preview surfaces to the shared component fed
   with the stored `peaks` (no decode), seek wired to the global player.
4. Tests + stories per surface; bundle check (eager chunks must not grow).

## Decided (user, 2026-10-21)

- **Previews:** only the large ones (track page hero, Studio sound header,
  edit / upload dialog). Ambient list rows keep the light canvas.
- **Peaks:** previews use the stored `[0..255]` peaks (no decode); the editor
  decodes the audio in the browser for full zoom detail. No new API.
- **Playback:** the global player. wavesurfer only draws and seeks, bound to
  the app's player audio element (`media` option), in previews and the
  editor alike.
- **Look:** rounded bars mirrored around the centre, progress in the theme's
  `--primary`.

## Decisions

1. ~~**Which previews**~~ — large only (hero, Studio header, edit dialog).
2. ~~**Peaks source**~~ — stored `[0..255]` for previews; decode in editor.
3. ~~**Playback**~~ — display + seek bound to global player `media`.
4. ~~**Editor plugins**~~ (batch 88) — Regions, Timeline, Minimap, Zoom, Hover.
   No Envelope / Spectrogram / Record in v1.
5. ~~**Look**~~ — rounded mirrored bars; progress `--primary`.
6. ~~**Desktop app**~~ (batch 88) — deferred; reuse `@tahti-player/ui` `Waveform`
   later.
7. ~~**Old code**~~ (batch 88) — keep ambient canvas + player-bar
   `WaveformSeekbar`; replace large preview call sites; ProWaveform remains
   fallback until editor parity is done.
