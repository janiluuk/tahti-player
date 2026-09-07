# Waveform: replace low-detail bars with an accurate, detailed render

**Status:** open

Reported 2026-09-07: the track waveform needs to be "a lot more detailed" and an "accurate description of the waveform" — at minimum in the full track view, and similar places.

## Current state (found this pass)

- **`WaveformSeekbar`** (`packages/tahti-web/src/components/tahti/WaveformSeekbar.tsx`) is what `TrackDetailView.tsx` uses for the full track view (line 566), and also what Library's `MyDiscographyView` row list uses. It:
  - Fixed `BAR_COUNT = 64` — any real `peaks` data gets downsampled to 64 bars via `resamplePeaks()` (averaging), regardless of how much real detail is available.
  - When a track has **no** `peaks` at all, it doesn't fall back to "less detail" — it fabricates a fake waveform from a deterministic sine-based PRNG keyed on the track id (`barHeights()`/`seedFromId()`). This is not audio data in any way; it's stable-looking noise. This is very likely the main "not accurate" complaint if it applies to any real tracks today.
- **`WaveformCanvas`** (`packages/tahti-web/src/components/WaveformCanvas.tsx`) already exists and is meaningfully more capable: draws real `peaks` at device-pixel canvas resolution (not a fixed bar count), supports a zoom/pan window. Currently only used in editing contexts — `StudioProEditorView.tsx`, `TracklistEditor.tsx`, `StudioCollectionEditView.tsx` — not in the listener-facing full track view.
- Not checked this pass: how many real amplitude samples `peaks` actually contains coming from the backend for a real (non-mock) track (`../tahti-org`) — if the source data itself is coarse, no amount of client-side rendering fixes "accuracy." `mockPeaks()` in `src/api/mock.ts` generates 100–220 mock samples per track as a rough proxy, not verified against real backend output.

## Scope for whoever picks this up

1. Confirm real backend peak-data resolution (`../tahti-org`) before assuming the fix is purely client-side rendering.
2. Decide whether `TrackDetailView`'s full track view should switch to (an adapted, non-editing) `WaveformCanvas` instead of `WaveformSeekbar`, or whether `WaveformSeekbar` should just lose its fixed 64-bar downsampling and fake-data fallback.
3. "similar places" from the report is not yet enumerated — grep every `WaveformSeekbar`/`Waveform` usage (`WaveformMinimap.tsx`, `tahti/Waveform.tsx` ambient motif, Library row list, queue, etc.) and decide per-surface whether more detail belongs there too, or whether the fix is scoped to the full track view only.
4. If keeping the synthetic-fallback path for genuinely peakless tracks, it should read as an explicit "no waveform data" state rather than a fabricated one that looks real.
