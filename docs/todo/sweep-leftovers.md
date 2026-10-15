# Sweep leftovers

**Status:** partial

Found by the sweeps of batches 52-59 (2026-10-14 and 15) and not fixed there. Batch 56 (#698-#712) fixed the component icon gaps, most of the 320 px overflows and widened phone track titles; batch 58 (#722-#735) fixed the Add-ons docs path, the gated downloads table and the rest of the 320 px list except the stem editor tab below.


- [ ] Deploy janiluuk/tahti-org#834 (submitter on `GET /api/admin/venues`). Until then Admin → Venues reads "submitted <date>" as before (#770 handles both).

Checked and not a bug: channel and track pages measure 24-32 px wider than their column because the full-bleed banner uses `-m-8` against the scroll frame's `p-8` and the frame clips at its own edge; the Feed cards' extra 12 px is the blurred glow behind each card; the 768 px voting-activity list on Admin → Governance scrolls sideways on purpose (#647); the phone avatar's unread badge sits outside the 24 px avatar on purpose (#666); the stem editor's 1 px "level" rows are screen-reader-only labels; the hidden file inputs flagged as unlabeled are `aria-hidden` with `tabindex="-1"` (#639); the crawler counted no `h1` on `/account`, but it measured during the redirect; `/settings/account` has one ("Account") in the Settings dialog. Settings → Themes' preview stripes overhang their card on purpose (skewed, clipped by the card); the admin second-level nav scrolls sideways on a phone on purpose. The schedule week grid and the Feed card carousels run past the edge inside their own sideways scroll on purpose; the Add-ons card author beside its title is #675.

Batch 59 axe artifacts, not bugs: `landmark-one-main` and `page-has-heading-one` on desktop pages, and `aria-dialog-name` on the login dialog, came from the crawler running axe before the route or Headless UI's title had rendered (the pages have their `main`, `h1` and `aria-labelledby`). At 390 px the missing `main` was real (#757). The axe crawl followed download links (`*.csv`, `press-kit.zip`), which have no `<title>` or `lang`.
