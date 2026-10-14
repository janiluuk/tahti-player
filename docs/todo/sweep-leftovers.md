# Sweep leftovers

**Status:** open

Found by the sweeps of batches 52-54 (2026-10-14) and not fixed there. Batch 54 (#665-#679) fixed eight of the eleven items listed after batch 53; what is left, and what batch 54 found, is below.

- [ ] Admin → Venues cannot say who submitted a venue: `GET /api/admin/venues` sends `createdBy` as an account id. Needs the submitter's username from tahti-org.
- [ ] Track tables on a phone still cut titles after about twelve letters. #671 stopped the controls overlapping; there is no more room in the row without dropping a control or moving the actions into a menu.
- [ ] `PluginItem` (the installed-plugins list) has the same name-and-author row as `PluginStoreItem` had before #675, including a `<p>` inside its `<h3>`.
- [ ] Admin → Users at 1280 px: the account's name row (name plus role badge) is 5 px wider than its column; not visibly cut.
- [ ] The mock app has no Jam sessions, so a Jam page (#668) cannot be checked offline.
- [ ] Not looked at in the desktop player: #671 (track table), #675 (add-on cards), #676 (log rows), #677 (one Tailwind build) and #679 (slider thumb) change shared components or CSS the player also uses.

Checked and not a bug: channel and track pages measure 32 px wider than their column because the full-bleed banner uses `-m-8` against the scroll frame's `p-8` and the frame clips at its own edge; the Feed cards' extra 12 px is the blurred glow behind each card; the 768 px voting-activity list on Admin → Governance scrolls sideways on purpose (#647).
