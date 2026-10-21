# Waveforms with wavesurfer.js (audio editor + previews)

**Status:** blocked — on decisions 4, 6 and 7 below (user asked: ask before starting).

Requested 2026-10-21: integrate [wavesurfer.js](https://github.com/katspaugh/wavesurfer.js)
([wavesurfer.xyz](https://wavesurfer.xyz/)) and use it for the waveforms in the
audio editor and in previews. Not started.

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

## Decisions needed (ask the user)

1. ~~**Which previews**~~ (decided above): all of track rows (ambient lists), track page hero,
   player-bar seekbar, Studio sound header, upload / edit dialog, channel
   stage — or only the large ones (hero, Studio header) while list rows keep
   the light canvas for performance (dozens of instances per page)?
2. ~~**Peaks source**~~ (decided above): keep the stored `[0..255]` buckets for previews
   (fast, no decode) and decode the audio in the browser only in the editor;
   or add a higher-resolution peaks endpoint in tahti-org for editor zoom
   (needs API + worker work)?
3. ~~**Playback**~~ (decided above): wavesurfer as display + seek only, bound to the global
   player's audio element (one source of truth, music keeps playing across
   pages); or let wavesurfer own playback inside the editor only (separate
   preview audio while editing)?
4. **Editor plugins**: Regions, Timeline, Minimap, Zoom, Hover are assumed.
   Also Envelope (fade / gain curves), Spectrogram, Record (record into the
   editor)?
5. ~~**Look**~~ (decided above): bars vs continuous line; bar width / gap / radius; mirrored
   (centre) vs bottom-aligned; progress colour from `--primary` or the
   track's artwork / ambient colour (as `AmbientTrackRow` does today)?
6. **Desktop app**: same component for native library files (decode local
   files, or reuse the desktop analysis peaks)?
7. **Old code**: delete `WaveformCanvas` / `ProWaveform` / `ProMinimap` /
   `WaveformSeekbar` once replaced, or keep them as a lightweight fallback?
