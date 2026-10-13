# Sweep leftovers

**Status:** open

Found by the 1024 px and 390 px sweeps of batch 52 (2026-10-14) and not fixed there.

- [ ] The library `Toggle` can be squeezed in a flex row. Giving it `shrink-0` changes six player snapshots.
- [ ] Studio → Stats, "Engagement units" on a phone: the names are cut ("Free downl…") and each row has a track-artwork placeholder that means nothing there. It uses the shared `TopList`.
- [ ] Admin → Venues cannot say who submitted a venue: `GET /api/admin/venues` sends `createdBy` as an account id. Needs the submitter's username from tahti-org.
- [ ] In the mock app, Admin → AGM, Governance, Missed shows and Annual reports each make one request that answers 500 (a fetcher with no mock branch). Not checked which.
- [ ] `/dashboard` logs a router warning: the index route and the `/dashboard/$` splat both match it.
- [ ] Studio → Stats logs a chart "width(0) and height(0)" warning on load.
- [ ] The subscribe, chat moderation and jam tab titles do not name the artist or channel.
- [ ] Feed at 1024 px and the week grid on Schedule were flagged by the sweep and only glanced at.
