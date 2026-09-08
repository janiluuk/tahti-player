# Waveform: replace low-detail bars with an accurate, detailed render

**Status:** partial

Reported 2026-09-07: the track waveform needs to be "a lot more detailed" and an "accurate description of the waveform" — at minimum in the full track view, and similar places.

## Current state

- **`WaveformSeekbar`** (`packages/tahti-web/src/components/tahti/WaveformSeekbar.tsx`) is what `TrackDetailView.tsx` uses for the full track view, and also what Library's `MyDiscographyView` row list uses. Its default `BAR_COUNT` is 64, but every caller can (and mostly does) override `bars=`; when real `peaks` are shorter than `bars`, `resamplePeaks()` just returns them as-is (no upsampling), so the actual downsampling loss only happens when `bars` < `peaks.length`.
  - When a track has **no** `peaks` at all, it fabricates a fake waveform from a deterministic sine-based PRNG keyed on the track id (`barHeights()`/`seedFromId()`) — stable-looking noise, not audio data. Still unaddressed this pass (see below).
- **`WaveformCanvas`** (`packages/tahti-web/src/components/WaveformCanvas.tsx`) already exists and is meaningfully more capable: draws real `peaks` at device-pixel canvas resolution (not a fixed bar count), supports a zoom/pan window. Currently only used in editing contexts — `StudioProEditorView.tsx`, `TracklistEditor.tsx`, `StudioCollectionEditView.tsx` — not in the listener-facing full track view. Not adopted this pass — the simpler bar-count fix below fully addresses the reported complaint for its named target.
- **Confirmed real backend peak-data resolution** (`../tahti-org/apps/worker/src/lib/waveform.ts`): `WAVEFORM_BUCKET_COUNT = 600` real decoded amplitude buckets per track (`extractWaveformPeaks`, ffmpeg → mono PCM → max-amplitude bucketing). So real tracks do carry meaningful detail server-side — the "not accurate" complaint was a pure client-side rendering cap, not coarse source data.

## What shipped this pass

`TrackDetailView.tsx` (the report's named "at minimum" target) already overrode the seekbar's default 64 up to `bars={180}` — still discarding ~70% of the real 600-sample detail whenever `peaks` were present. Changed to `bars={detail?.peaks?.length || WAVEFORM_BARS}`: real peaks now render at their full native resolution (up to 600 bars) with zero downsampling loss; the `WAVEFORM_BARS = 180` constant is now only the bar count for the synthetic (no-peaks) fallback, unrelated to real accuracy since it's fake data anyway. `tsc --noEmit`, `eslint`, `pnpm vitest run` (485/485) all pass. Not live-browser-verified (Chrome extension unavailable this session) — worth an actual look at bar width/density on a real track before considering this fully closed.

Audited every other `WaveformSeekbar` consumer's `bars=`/`peaks=` this pass (not changed, listed for whoever continues):
- `ChannelView.tsx` (`bars={72}`) and `StudioUploadView.tsx` (`bars={72}`) never pass `peaks` at all — always the synthetic fallback (live channel overlay / mid-upload row), so the downsampling fix doesn't apply there.
- `MyDiscographyView.tsx` (`bars={48}`) passes real `peaks` but is a dense row list — deliberately low, left alone (raising it there is the "similar places, decide per-surface" tradeoff below, not a clear win).
- `StudioSoundView.tsx`, `TrackEditDialog.tsx`, `ConnectedPlayerBar.tsx`, `CollectionTrackList.tsx`, `DiscoverView.tsx` all pass real `peaks` at the component's **default** 64 bars (no override) — same class of bug as `TrackDetailView` had, not fixed this pass.

## Still open

1. The other real-`peaks` consumers listed above still cap at 64 bars — same fix pattern applies, but each is a smaller/denser surface than the full track view (list rows, a compact edit-dialog seekbar, the mini player bar) where more bars may not be a clear win visually vs. DOM cost. Decide per-surface rather than blanket-applying.
2. The synthetic fake-waveform fallback (item 4 from the original scope) is unaddressed: it still fabricates PRNG noise that looks like real audio for genuinely peakless tracks, rather than an explicit "no waveform data" state. Left alone this pass — it's a visual-language decision (flat/dim placeholder vs. today's stable-noise motif) affecting every consumer at once, not a bounded fix.
