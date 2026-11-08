# Channel page: public metrics, About placement, participant events

**Status:** open

User request 2026-11-08 (screenshot from the legacy profile sidebar: Events
link, then a stat list with icons — Followers, Following, Plays today, Plays
yesterday, total plays, downloads — then an About section with the bio,
paragraphs and links).

## Want

1. **Metrics on the user's channel page**: followers, following, plays today,
   plays yesterday, total plays, downloads — icon + bold number + label, one
   per line, numbers in the viewer's locale (`47.875` in fi, `47,875` in en).
2. **Artist chooses what shows publicly**: a per-metric toggle in Studio →
   Profile (or Channel settings); hidden metrics are not sent by the public
   API at all, not just hidden in CSS. Default: followers + total plays on,
   the rest off (product call — confirm with the user).
3. **About section placed neatly**: bio paragraphs keep line breaks, links are
   clickable, sits next to/under the metrics rather than floating; check 390,
   768 and 1366 px (with queue panel open).
4. **Events**: list the artist's **upcoming and past** events — including
   events where the artist is a **participant / lineup member**, not only the
   events they created. Upcoming soonest first, past newest first, past
   collapsed after a few.

## Likely backend work (`../tahti-org`)

- Public channel/profile payload: add the counters that are missing
  (plays today / yesterday, downloads, following) and a
  `publicMetrics` visibility setting on the channel/profile; omit hidden ones.
- Events: a public query for events where the user is the owner **or** a
  participant (lineup / performer relation) — check what the event model
  stores for participants before adding a relation.
- Check whether the per-day play counts already exist (listen heartbeats /
  stats tables used by Studio stats) so no new aggregation job is needed.

## Done when

Channel page shows the chosen metrics and hides the rest (also absent from
the API response); the setting saves in Studio; About renders cleanly at the
three widths; Events lists next and past events including ones the artist
plays at; Storybook stories for the metrics block and both event lists; unit
tests for the visibility filter (web + API).
