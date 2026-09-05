# Channel Designer: Links prefill from social links, "Home" → "Stage"

**Status:** 2 of 4 sub-asks shipped (2026-09-05); 2 flagged, not
attempted — see below for why.

## Shipped

### 1. Links section pre-fills from the artist's social links

`ChannelView.tsx` already fetches `fetchProfile(username)` for the
channel's follower count (a `PublicProfile` response, distinct from —
and easy to confuse with — `fetchMeProfile()`'s `ProfileFields.socialLinks`,
which is actually import/cross-posting *handles*, e.g. hearthis.at
username, not URLs). `PublicProfile.artist.socialLinks` is the real one:
actual social media URLs, the same field `ArtistView.tsx` already reads
for its own "profile connections" icon row (filtering out the
`genres`/`showConnections` non-URL flag keys mixed into the same
record).

Extended that existing fetch's callback: when the channel has no saved
`channelLinks` yet, convert the artist's `socialLinks` entries (same
filter as `ArtistView.tsx`) into `ChannelLink[]` (`{label, url}`,
label = capitalized key) and seed `channelLinksDraft` with them. This
only pre-fills the *draft* shown in the Links editor — nothing is saved
until the artist actually presses Save, and an already-saved
(non-empty) Links block is never overwritten.

### 2. "Home" renamed to "Stage"

`ChannelView.tsx`'s hero `navItems` had `{ id: 'home', label: 'Home' }`
— the only place this specific channel-content-area label existed
(grepped for other "Home" strings in this file; nothing else matched).
Changed the label to "Stage"; left the `id` as `'home'` since nothing
external references the id, only the internal `active`/scroll-target
wiring.

## Not attempted — flagged

### 3. Eye icon to show/hide each link

Investigated: `ChannelLink` (`api/channel-design.ts`) is just
`{ label: string; url: string }` — there is no `hidden`/`visible` field
in the data model today. Adding a real per-link show/hide toggle needs
that field added end-to-end: the type, wherever `channelLinks` is
persisted (`saveChannelLookExtras`/`patchChannelVisual`), and the public
renderer (`ChannelView.tsx`'s "links" block case) skipping hidden
entries. That's a real schema change, not a UI-only addition — didn't
want to bolt on a client-only "hidden" flag that silently doesn't
round-trip through a save/reload cycle. Needs confirming whether the
backend already has room for this field, or whether it needs adding
there first.

### 4. Move the player out of the backdrop into the "Home" (Stage) area

This is the same category of change flagged and deferred earlier this
session in `docs/todo/channelview-badge-dedup-and-share-modal.md`
("move the player above the tabs") — extracting the hero block's player
out of the generic `renderBlock`/`visibleItems.map` data-driven layout
loop and giving it a fixed position is a real structural change to a
~1600-line view's block-rendering system, not a class-name tweak. That
earlier item was resolved differently (the Overview/Manage tabs it was
originally about got replaced with a Stream Manager modal instead —
see `channelview-stream-manager-modal-replaces-tabs.md`), but *this*
ask is a different, still-open version of the same underlying
question: where does "Home" as a distinct destination actually begin
and end relative to the backdrop's own header content? Needs a
deliberate pass, ideally with the user's input on exactly what "Home
area" should look like once the player moves — not a guess.

## Verification

`tsc --noEmit`, `eslint`, `pnpm --filter @tahti-player/tahti-web test`
(467 tests, all passing), and `pnpm --filter @tahti-player/tahti-web
build` all pass for the two shipped changes. Not manually verified in a
running browser — the social-links prefill in particular is worth a
live check against a real artist profile with social links configured.
