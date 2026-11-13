# Processing track opens as “not found”

**Status:** open

## Bug

Clicking a track that is still processing (`PENDING` / `PROCESSING`) shows
a not-found state instead of the track view.

## Wanted

Open the normal track view. Where the waveform would be, show an animated
processing indicator (not an empty or broken waveform, not a 404).

## Notes

- Studio Sounds already knows processing status on list rows
  (`SoundRow`, `SoundsAmbientList`); the public/listen track detail path
  likely 404s when there is no playable audio yet, or the client treats a
  missing stream as not found.
- May need the API to serve a track/sound detail DTO for non-READY sounds
  the viewer is allowed to see (owner at least), with `status` and no
  stream URL — check `../tahti-org` track/sound detail routes.
- Related ops: stuck PENDING uploads in `../tahti-org`
  `docs/todo/worker-lane-handoff.md`.

## Done when

- Opening a processing track from Studio (and any other entry that links
  to it) lands on the track view.
- Waveform slot shows a clear animated processing state until READY.
- READY tracks still show the waveform as today.
