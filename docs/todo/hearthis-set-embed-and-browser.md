# hearthis.at set embeds + "browse my sets" picker

**Status:** done (2026-09-05).

## Background

Two user reports:
1. Pasting a hearthis.at **set** page URL (e.g.
   `https://hearthis.at/yaniho/set/recorded-sets-from-gigs/`) into the
   Listen "hearthis.at" add-on failed — `toEmbedUrl` only recognized a bare
   numeric track id or a `hearthis.at/embed/<id>/` URL, and set embeds use
   a different, token-bearing shape (`hearthis.at/set/<id>-<user>/embed/<token>/`)
   that isn't derivable from the page URL alone.
2. Feature request: once a hearthis.at username is entered, list that
   user's sets so they can be added with one click instead of manually
   hunting for embed links.
3. Separately: the hearthis.at addon's config should open in a modal
   (its own request), since the "browse my sets" list can get tall.

## What was found (reverse-engineered, no official docs)

- Every hearthis.at page exposes a standard **oEmbed** endpoint:
  `<page-url>oembed.json` → JSON with an `html` field containing the
  iframe embed markup (works for tracks, sets, and profile pages alike).
  CORS is wide open (`access-control-allow-origin: *`), so this is
  callable directly from the browser.
- `https://api-v2.hearthis.at/<username>/?type=playlists&page=1&count=50`
  lists a user's public sets (id, title, description, track_count, thumb,
  permalink_url) — found via the `python-hearthis` PyPI package's source
  (`artist_list(artist, type="playlists")`), also CORS-open. The set's
  embed *token* isn't included in this listing — each chosen set still
  needs a second oEmbed round-trip to resolve its real embed src.

## What shipped

- `packages/tahti-web/src/content/listenerWidgets.ts`:
  - `hearthisEmbedUrl` (sync, used on every render) now also accepts an
    already-resolved `hearthis.at/set/<id>-<user>/embed/<token>/` URL as
    pass-through valid.
  - `resolveHearthisPageEmbedUrl(pageUrl)` (async) — resolves *any* public
    hearthis.at track/set page URL to its embed src via oEmbed.
  - `fetchHearthisUserSets(username)` (async) — lists a user's sets via
    the api-v2 endpoint above, mapped to a `HearthisSet` type.
  - Updated the stale `helpText`/`placeholder` ("Track pages without an
    embed ID are not supported yet") which predated both of the above.
- `packages/tahti-web/src/components/ListenAddonsPanel.tsx`:
  - `addWidgetInstance`: when the sync resolver rejects a hearthis.at
    input that's an http(s) URL, tries `resolveHearthisPageEmbedUrl`
    before giving up (shows "Resolving…" on the Add button meanwhile).
  - New "browse your sets" block under the hearthis card: username input
    → `loadHearthisSets()` → list with thumbnail/title/track-count/Add
    per row; Add resolves that set's embed via oEmbed then calls
    `addInstance` directly (bypassing the free-text input entirely).
  - `ConfigurableCard` gained an `asModal` prop (Dialog instead of the
    inline expanding Box) — set for the hearthis card only; every other
    addon's config still expands inline, unchanged.

## Not done / deliberately out of scope

- No caching/dedup of the "browse my sets" username across sessions —
  re-typed each time the config is opened. Low value versus the added
  state-persistence complexity for a rarely-used picker.
- No pagination past the first 50 sets (`count=50` in the API call) —
  fine for essentially every real account; add `page`/"load more" only if
  someone actually hits the ceiling.
- Didn't verify nested-Dialog stacking (this modal opens from inside the
  Listen page's own "Add Listen widgets" dialog when reached that way) in
  a real browser — HeadlessUI generally supports independent nested
  dialogs via portal mount order, but this wasn't visually confirmed.

## Verification

`packages/tahti-web`: `tsc --noEmit`, `eslint` clean on all touched files.
`pnpm --filter @tahti-player/tahti-web build` succeeds.
`listenerWidgets.test.ts`: 23/23 pass, including new coverage for the
set-embed pass-through, `resolveHearthisPageEmbedUrl` (mocked `fetch`:
success, non-hearthis.at short-circuit, request failure), and
`fetchHearthisUserSets` (mocked `fetch`: mapping, unsafe-username
short-circuit, non-array response). No live-browser test of the modal or
the actual oEmbed/api-v2 network calls beyond the curl checks done during
investigation.
