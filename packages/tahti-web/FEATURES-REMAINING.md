# FEATURES — remaining / partial (open only)

Short extract from [`FEATURES.md`](FEATURES.md). Agents: prefer this file over the full matrix.

When an item ships: remove it here **and** from FEATURES Remaining; fold a one-liner to `docs/todo/HISTORY.md`.

- [ ] Multitrack timeline editing — confirmed greenfield (no track array/timeline model anywhere), a multi-day build needing a rendering-architecture decision first, not a slice. Press-kit gallery is done (see above); member invites checked and mostly already covered — adding a moderator by existing username is live-API at `/studio/moderation`. A true email-invite-for-non-account-holders flow is a separate, larger feature with no backing API; deferred, not clearly needed.
- [ ] Production cutover for `apps/web`
- [ ] À la carte track purchase (public track page is Download, not Buy) — live Stripe path exists; Buy UX on public track still incomplete
- [ ] Radio channels beyond `tahti-radio`: a per-station programming grid (the Programming block links to the global `/schedule`), an admin/Designer control to set `channelKind`, and pages for the 6 external Finnish radio presets (currently link-outs). Background: `docs/todo/HISTORY.md` 2026-09-26 radio channel page entry
- [ ] Track visualization video editor: full-screen editor built on PulseForge for making audio-reactive videos of a track. See `docs/todo/track-visualizer-video-editor.md`
