# Sweep leftovers

**Status:** open

Found by the sweeps of batches 52-56 (2026-10-14) and not fixed there. Batch 56 (#698-#712) fixed the component icon gaps, most of the 320 px overflows and widened phone track titles; what is left, and what batch 56 found, is below.

- [ ] Admin → Venues cannot say who submitted a venue: `GET /api/admin/venues` sends `createdBy` as an account id. Needs the submitter's username from tahti-org.
- [ ] Track tables on a phone still truncate titles: #710 gave the Title column back the empty actions column (about five letters at 320 px, ten at 390), but the thumbnail (56 px) and favourite (40 px) columns stay. More room needs dropping or folding one of them on narrow tables (product call).
- [ ] Admin → Add-ons' description tells board members to "see docs/todo/admin-plugin-management-panel.md", an internal repo path (same kind of leak as #707).
- [ ] At 320 px only (fine at 360): Admin → Add-ons and Disco widgets rows (17 px), Admin → Feature requests' report header (14 px), Admin → Users filter column (15 px), Admin → Missed shows times, Studio → Go Live / Info's encoder row (6 px), the stem editor's grid (20 px), Settings → Playback (5 px), Studio → Upload (3 px) and the News timeline (6 px).
- [ ] Studio → Stats → gated downloads at 360 px: the Track column is 83 px, so long titles wrap over four lines and the Block column is cut (the table may scroll; not checked).
- [ ] Not looked at in the desktop player: #671, #675, #676, #677, #679, #681, #690, #695 and now #710 (the track table's actions column is narrower or gone where a table has fewer row actions; the player's Album, Artist, Favorites and Playlist snapshots changed) touch shared components or CSS the player also uses.

Checked and not a bug: channel and track pages measure 24-32 px wider than their column because the full-bleed banner uses `-m-8` against the scroll frame's `p-8` and the frame clips at its own edge; the Feed cards' extra 12 px is the blurred glow behind each card; the 768 px voting-activity list on Admin → Governance scrolls sideways on purpose (#647); the phone avatar's unread badge sits outside the 24 px avatar on purpose (#666); the stem editor's 1 px "level" rows are screen-reader-only labels; the hidden file inputs flagged as unlabeled are `aria-hidden` with `tabindex="-1"` (#639); the crawler counted no `h1` on `/account`, but it measured during the redirect; `/settings/account` has one ("Account") in the Settings dialog. The schedule week grid and the Feed card carousels run past the edge inside their own sideways scroll on purpose; the Add-ons card author beside its title is #675.
