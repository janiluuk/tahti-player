# FEATURES — remaining / partial (open only)

Short extract from [`FEATURES.md`](FEATURES.md). Agents: prefer this file over the full matrix.

When an item ships: remove it here **and** from FEATURES Remaining; fold a one-liner to `docs/todo/HISTORY.md`.

- [ ] Multitrack timeline editing — confirmed greenfield (no track array/timeline model anywhere), a multi-day build needing a rendering-architecture decision first, not a slice. Press-kit gallery is done (see above); member invites checked and mostly already covered — adding a moderator by existing username is live-API at `/studio/moderation`. A true email-invite-for-non-account-holders flow is a separate, larger feature with no backing API; deferred, not clearly needed.
- [ ] Production cutover for `apps/web`
- [ ] À la carte track purchase (public track page is Download, not Buy) — live Stripe path exists; Buy UX on public track still incomplete
- [ ] Radio channels beyond `tahti-radio`: an admin/Designer control to set `channelKind` (needs a tahti-org write route; only `GET /api/channels/:slug` exposes it) and programming for RADIO channels other than `tahti-radio` (no per-station calendar in the API). Done 2026-09-28: tahti-radio's Programming block lists the week of booked slots (#207); the 6 curated Finnish stations have in-app pages at `/radio/station/$stationId` (#208)
- [ ] Track visualization video editor: full-screen editor built on PulseForge for making audio-reactive videos of a track. See `docs/todo/track-visualizer-video-editor.md`
