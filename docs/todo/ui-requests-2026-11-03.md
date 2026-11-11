# UI requests, 2026-11-03 (open queue)

**Status:** open

Requests from the 2026-11-03 session not shipped yet. Shipped items moved to HISTORY with #1800.

## Bugs
- [ ] Product call: should board members edit any track? Needs an admin sound-edit route in tahti-org first.
- [ ] Embed tracks can't play from their track page: re-done as tahti-org#1052 (the old branch was gone); merge and deploy, then verify on a Mixcloud/hearthis embed track.
- [ ] NRJ radio doesn't play (see `radio-nova-nrj-playback.md`; tahti-org #1044 moved presets to Bauer's host).
- [ ] Real waveforms for every track: tracks ingested without peaks need server-side peaks (tahti-org worker computes on upload + a backfill script). Decoding full mixes in the browser isn't viable (hundreds of MB).
- [ ] "tahti.live" in the top menu: not found in web code or live DOM; ask where it shows (desktop app menu?).

## Listen / Discover
- [x] Recently played: text search. `filterable` is the CardsRow default (on), so the filter box shows once the row has enough items.

## Track page
- [ ] Like button placement and icon actions: done in #1800; verify.

Finnish locale and the Settings language menu shipped; the rest is in `finnish-localization.md`.
