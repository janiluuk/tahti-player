# Sweep leftovers

**Status:** open

Found by the sweeps of batches 52 and 53 (2026-10-14) and not fixed there.

- [ ] Track tables on a phone (artist page as its owner): the cover sticks out a few pixels past the row (a 44 px button in a 39 px cell), titles are cut after about ten letters, and the favourite and queue icons sit on top of each other. Shared `TrackTable`.
- [ ] Admin → Venues cannot say who submitted a venue: `GET /api/admin/venues` sends `createdBy` as an account id. Needs the submitter's username from tahti-org.
- [ ] Still going to the network in the mock app: governance minutes upload, attendance, conflicts of interest, notice deliveries and new documents.
- [ ] `/dashboard` logs a router warning: the index route and the `/dashboard/$` splat both match it.
- [ ] On a phone the phone top bar's unread badge covers the account button's caret.
- [ ] On a phone an add-on's name and author share a line and both wrap ("Radio / Browser / directory").
- [ ] A log row's scope chip touches the right edge on a phone, and a stem slider's thumb sticks out about 10 px at 100 %.
- [ ] Admin → AGM agenda items on a phone: the inputs cut long titles beside their three buttons.
- [ ] Jam tab titles do not name the host; subscribe and moderation titles use the handle, not the display name.
- [ ] In the mock app every `/r/<slug>` shows the same release ("First Light EP").
- [ ] Channel and track pages are 24–32 px wider than their column at every width (no visible effect found; not investigated).
