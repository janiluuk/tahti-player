# Pre-generate Yaniho channel peaks

**Status:** open

Slice 30 of the next-50 queue. Parent: [`yaniho-channel-waveform-peaks.md`](yaniho-channel-waveform-peaks.md). Checking this off does not close the parent; fold the parent when its own leftover is gone.

## Goal

Pre-generate peaks so Yaniho channel tracks are not stuck loading.

## Done when

Processing writes peaks before the track is public. /channel/yaniho no longer sits on a loading waveform.
