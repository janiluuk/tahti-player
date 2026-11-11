# Yaniho channel: tracks stay loading over the waveform

**Status:** open

User report 2026-11-11: on the Yaniho page, every track still shows a loading
state over the waveform.

## Page

Yaniho is the channel slug. `yaniho.tahti.live` opens `ChannelView` at
`/channel/yaniho` (`packages/tahti-web/src/views/ChannelView`, route
`channelRoute` in `packages/tahti-web/src/router/routes-library.tsx`). The
artist profile is the separate route `/u/yaniho` (`ArtistView`). The reported
page is the channel.

## Bug

Every track on that channel page still shows a loading state over the
waveform. The peaks are not ready when the view opens, so each row waits
instead of drawing a stored waveform.

## Required fix

Waveform peaks for **all views** are pre-generated during pre-processing.
That is the BullMQ worker that already runs after upload complete
(transcode, peaks, fingerprint; status `PROCESSING` → `READY` — see
[`docs/DATA-FLOW.md`](../DATA-FLOW.md)). Views read those stored peaks.
They do not fetch audio or compute peaks when the view opens.

This covers every surface that draws a waveform (channel, artist profile,
lists, player, track pages, Studio), not only `/channel/yaniho`. Sounds that
are already processed and still have no peaks need the same generation in
that pre-processing path (a backfill), so opening a view never starts the
work.

## Related

Leave these as they are; this todo is the pre-generation gap the Yaniho
channel still shows:

- [`server-peaks-in-track-lists.md`](server-peaks-in-track-lists.md)
  (partial) — list payloads should carry `peaks`. Channel items are marked
  as already returning peaks there; this report says the Yaniho channel
  still loads.
- [`ui-requests-2026-11-03.md`](ui-requests-2026-11-03.md) — tracks ingested
  without peaks need server-side peaks.

## Done when

- `/channel/yaniho` draws each track waveform from pre-generated peaks, with
  no loading state over the waveform. The same holds for the other views.
- Peaks exist before the view opens. Pre-processing writes them; the client
  does not fetch or compute them on open.
