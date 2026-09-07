# Listen widget: hearthis.at config UX + broken set-embed add

**Status:** open
(Later) — reported 2026-09-08, not investigated in depth.

## Ask

1. The hearthis.at listen-widget configuration (`ListenAddonsPanel.tsx`)
   makes the artist manually type their hearthis.at username every
   time to browse their own sets — it should read it automatically
   from wherever it's already stored.
2. Replace the configuration dialog's form controls with icon buttons
   and Storybook (`@tahti-player/ui`) components — general UI polish,
   not scoped further.
3. Bug: adding an embed for a hearthis.at **set** never works (unlike
   individual tracks).

## Starting points (found this pass, not yet acted on)

**1. Auto-fill username** — `api/artist-settings.ts` already has a
`hearthisAt: string` field (line ~101) that stores the artist's own
hearthis.at handle. `ListenAddonsPanel.tsx`'s `hearthisUsername` state
(~line 159) is currently always seeded empty and typed manually by the
user (`Input label="Your hearthis.at username"`, ~line 593) before
`loadHearthisSets()` can run. Should default/prefill from the artist's
own saved `hearthisAt` setting instead.

**2. Config dialog → icon buttons + Storybook components** —
`ListenAddonsPanel.tsx` already renders its per-type config panel in a
`Dialog` (`asModal={type.id === 'hearthis'}`, ~line 499) using shared
`@tahti-player/ui` primitives (`Dialog`, `Input`, `Button`, etc.) — not
investigated further what specifically should become icon buttons;
needs the user to point at which controls.

**3. Set-embed bug** — `addHearthisSet()` (~line 283) calls
`resolveHearthisPageEmbedUrl(set.pageUrl)`
(`content/listenerWidgets.ts` ~line 198), which fetches
`<pageUrl>oembed.json` and regex-extracts `src="..."` from the
returned HTML. If hearthis.at's oEmbed response shape/CORS behavior
differs for `/set/...` pages vs. individual track pages, this would
silently return `null` for every set, matching "unable to add embed
for any hearthis.at set." Needs a real fetch against hearthis.at's set
oEmbed endpoint to confirm (not done — no network access assumed
during triage).
