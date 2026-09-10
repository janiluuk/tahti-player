# Listen widget: hearthis.at config UX + broken set-embed add

**Status:** partial — 2 of 3 asks shipped, 1 needs the user to point at specifics.

## Ask

1. ~~The hearthis.at listen-widget configuration (`ListenAddonsPanel.tsx`)
   makes the artist manually type their hearthis.at username every
   time to browse their own sets — it should read it automatically
   from wherever it's already stored.~~ **Shipped.**
2. Replace the configuration dialog's form controls with icon buttons
   and Storybook (`@tahti-player/ui`) components — general UI polish,
   not scoped further. **Still open — needs a decision, see below.**
3. ~~Bug: adding an embed for a hearthis.at **set** never works (unlike
   individual tracks).~~ **Shipped — real root cause found and fixed.**

## What shipped

**1. Auto-fill username** — `ListenAddonsPanel.tsx`'s mount-time
`fetchMeProfile()` effect (already used to seed the SoundCloud profile
field) now also seeds `hearthisUsername` from
`profile.data.socialLinks?.hearthisAt` when set. Confirmed this is the
actively-used canonical field (not `SocialConnections.hearthisAt` in
`api/artist-settings.ts`, a different, unrelated store) — it's the
same key `PluginStorePanel.tsx`'s hearthis.at library-import card reads
and writes via `patchMeProfile({ socialLinks: { hearthisAt } })`.

**3. Set-embed bug — real root cause found by testing against the live
hearthis.at API** (curl, not guessed): `fetchHearthisUserSets()`'s
`permalink_url` for a **set** (e.g.
`https://hearthis.at/set/94377-304336/`) 302-redirects to a different,
human-readable canonical path (e.g.
`https://hearthis.at/rdubzuk/set/rdubz-journeys-inapt/`). `oembed.json`
only exists at the canonical path — appending it to the pre-redirect
URL returns **HTTP 200 with an empty body** (confirmed with `curl -i`),
which fails JSON parsing and silently resolves to `null`. Individual
track pages never showed this bug because their `permalink_url` is
already canonical (no redirect). Fixed
`resolveHearthisPageEmbedUrl()` (`content/listenerWidgets.ts`) to
resolve the redirect first (a `HEAD` request, `redirect: 'follow'` —
both hops already send `Access-Control-Allow-Origin: *`, confirmed via
curl, so this works cross-origin from the browser with no proxy needed)
and build the `oembed.json` URL from `response.url` (the final,
post-redirect location) instead of the input URL. Added a regression
test pinning the redirect-then-oembed sequence; all 24 existing
`listenerWidgets.test.ts` tests still pass.

`tsc --noEmit`, `eslint`, `pnpm vitest run` (`listenerWidgets.test.ts`:
24/24) all pass. Not live-browser-verified (Chrome extension
unavailable this session) — the fetch behavior itself was verified
directly against the real hearthis.at API via `curl`, including the
exact redirect chain and the empty-body failure mode, so this is
higher-confidence than a typical unverified fix, but an actual
click-through (paste a real set page URL / browse-my-sets flow) is
still worth doing before calling this fully closed.

## Still open

**2. Config dialog → icon buttons + Storybook components** —
`ListenAddonsPanel.tsx` already renders its per-type config panel in a
`Dialog` (`asModal={type.id === 'hearthis'}`) using shared
`@tahti-player/ui` primitives (`Dialog`, `Input`, `Button`, etc.) — it's
not hand-rolled HTML, so this ask is underspecified as written; not
guessed at. Needs the user to point at which specific controls should
become icon buttons before this can be implemented.
