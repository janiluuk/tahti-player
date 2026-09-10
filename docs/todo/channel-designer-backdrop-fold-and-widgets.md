# Channel Designer: fold bio/CTA/avatar into backdrop toggles; feed/posts as configurable widgets

**Status:** open (later — after current in-flight items)

Reported 2026-09-07, right after the opt-in Navigation tabs feature shipped (see `HISTORY.md`, 2026-09-07).

## The ask

1. Bio text is not a separate block — it should be part of the backdrop, toggled on/off from the backdrop's own settings ("show" toggle), not a draggable page block in the Layers list.
2. Same for the CTA button (the Subscribe block).
3. Avatar should also be toggleable from backdrop settings.
4. What stays as separate, addable blocks: latest releases, releases, and any content-type collections/items the user wants to add.
5. A "feed" block (user updates/posts) should be configurable with user-specified filters and a display style toggle (tracklist / card row / both, switchable via an icon) — this and similar things are "channel widgets" that should appear in the element list.

## Starting points (found this pass, not acted on)

- `packages/tahti-web/src/components/ChannelBackdropCard.tsx` already renders avatar (`avatarUrl` prop, ~line 251) and bio (`bio` prop, ~line 271) inline, unconditionally whenever the data exists — no show/hide prop exists yet. This is the component whose settings panel would need the new toggles.
- Meanwhile `packages/tahti-web/src/lib/channelPageLayout.ts`'s `CHANNEL_PAGE_ITEM_TYPES` still has `about` (bio + "Full artist profile →" link) and `subscribe` (CTA) as independent, separately-draggable page blocks (`ChannelView.tsx`'s `renderBlock` `case 'about'`/`case 'subscribe'`) — i.e. today bio/CTA can show in *both* the backdrop (via `ChannelBackdropCard`'s unconditional render) and as their own block, which is presumably the duplication being reported.
- This pass's [Navigation tabs feature](channel designer's `ChannelNavigationEditor.tsx`/`setNavigationTabs` pattern, see `HISTORY.md` 2026-09-07) is the closest precedent for "a block gets its own config UI wired through `ChannelLayersMenu`'s `lookSlot`" — the backdrop's `avatarUrl`/`bio`/CTA toggles would likely live in `ChannelDesigner.tsx`'s existing `lookOnly` background/backdrop settings panel instead (need to locate that panel's current field list before adding to it).
- No existing "feed"/"posts" layout block type was found in `CHANNEL_PAGE_ITEM_TYPES` this pass — `ListenView.tsx` has its own feed concept (listener-facing, not a channel-page block) and `channel-designer/LayoutOnlyLookHint.tsx` was the only other feed-adjacent hit, worth checking first. A configurable-with-filters feed/posts channel block, plus the tracklist/card-row/both display-style toggle, would be new.

## Scope note

This overlaps but is distinct from the Navigation tabs work: removing `about`/`subscribe` as standalone blocks (folding them into backdrop toggles) will change what a Navigation tab's `itemIds` can reference — check that interaction before implementing either the fold or new widget types. Don't start without confirming the exact backdrop-settings panel this hooks into.
