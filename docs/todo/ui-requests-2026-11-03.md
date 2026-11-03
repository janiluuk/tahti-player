# UI requests, 2026-11-03 (open queue)

**Status:** open

Requests from the 2026-11-03 session not shipped yet. Shipped items moved to HISTORY with #1800.

## Bugs
- [x] Track editing failed for board members on other artists' tracks (`/api/me/sound/:id` is owner-only, 404 "Sound item not found"): the Edit button now shows only to the owner.
- [ ] Product call: should board members edit any track? Needs an admin sound-edit route in tahti-org first.
- [ ] Embed tracks can't play from their track page: tahti-org branch `fix/track-detail-embed-fields` (commit f1262ee4, worktree `../tahti-org-embed`) adds `embedProvider`/`embedUri` to `GET /api/tracks/:id`. Needs push + PR + merge (production deploy).
- [ ] NRJ radio doesn't play (see `radio-nova-nrj-playback.md`; tahti-org #1044 moved presets to Bauer's host).
- [ ] Track page visualizer glitches (`/t/cmt4zs2yi0037oyp60s12xfva`).
- [ ] Waveform peaks aren't cached; tracks without peaks show dotted placeholder bars. Use real waveforms everywhere (compute/cache peaks).
- [ ] "tahti.live" in the top menu: not found in web code or live DOM; ask where it shows (desktop app menu?).

## Listen / Discover
- [ ] Recently played: no text search (CardsRow `filterable={false}` is set; verify on live).
- [x] Rows sharing a line align the same with or without a search box (CardsRow header keeps one height).
- [x] Story / news / feed cards follow the reference layout with the title overlaid on the image; Storybook updated.

## Channel page
- [ ] Play button in the standard top-left position with the other controls.
- [ ] Embeds in their own tab; replace the empty stage waveform with the embed widget.
- [ ] Content readable on dark backgrounds (`/channel/yaniho`).
- [ ] Radio channel: swipe left/right to change channel.

## Track page
- [ ] Like button placement and icon actions: done in #1800; verify.

## Localization
- [ ] Finnish locale for tahti-web with a language menu in Settings.
