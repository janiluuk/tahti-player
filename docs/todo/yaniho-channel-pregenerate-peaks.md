# Pre-generate Yaniho channel peaks

**Status:** open

Slice 30 of the next-50 queue. Parent: [`server-peaks-everywhere.md`](server-peaks-everywhere.md) (slices 4–5: backfill script and the prod Yaniho run in `../tahti-org`). The web side is done: views never decode audio, so this is only the data gap.

## Goal

Pre-generate peaks so Yaniho channel tracks are not stuck loading.

## Done when

Processing writes peaks before the track is public. /channel/yaniho no longer sits on a loading waveform.
