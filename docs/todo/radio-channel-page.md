# Radio channel page (initial)

**Status:** partial

## Ask (user, 2026-09-15)

Enable the 6 Finnish internet radio presets for everyone by default (done,
separately — production seed script run, confirmed live via the public API).
Then: build an initial radio channel page — "basically like artist page but
without the artist links or other artist info — rather programming", with
its own URL, fullscreen, individually styleable per channel.

Scope decision (user, asked directly): build this as a general radio-channel
page **type** on the existing Channel/ChannelView system (`channelKind`),
not a one-off for the 6 external Finnish presets specifically. Those 6 stay
simple link-out presets (`InternetRadioPreset` rows — name/logo/stream URL/
schedule link, no page, no slug) — promoting them into real Channel entities
with their own pages is separate, larger scope, not attempted here.

## Shipped this pass (2026-09-15)

**Backend (`../tahti-org`, uncommitted — see below):**
- `Channel.channelKind` (`ChannelKind` enum: `ARTIST` default / `RADIO`) —
  `packages/db/prisma/schema.prisma`, migration
  `20260915150000_channel_kind` (also backfills `tahti-radio`'s row to
  `RADIO`). Applied to local dev DB, `pnpm --filter @tahti/db db:generate`
  run, `apps/api` `channels/get.test.ts` (8/8) and `@tahti/shared`/`@tahti/api`
  `typecheck` all pass with it.
- `PublicChannelViewSchema` (`packages/shared/src/dto/responses/channels.ts`)
  and the `/api/channels/:slug` route (`apps/api/src/routes/channels/get.ts`)
  now expose `channelKind` in the public payload (`nextBroadcastAt`/
  `nextBroadcastNote` were already exposed there, just not yet read by the
  frontend — see below).

**Frontend (`tahti-player`, this repo, uncommitted on branch
`radio-channel-page` — see below):**
- `PublicChannel` type gained `channelKind?: 'ARTIST' | 'RADIO'` and
  `nextBroadcastAt?`/`nextBroadcastNote?` (`api/types.ts`); `mockChannel()`
  sets `channelKind` from the existing `isRadio` (slug === `tahti-radio`)
  local convention (`api/mock.ts`).
- New `programming` block type (`lib/channelPageLayout.ts`) — hidden by
  default in `defaultChannelPageLayout()` for ordinary artist channels (so
  it doesn't show up uninvited, and existing layout tests that assert every
  known type is covered exactly once still pass).
- `ChannelView.tsx`: when `channel.channelKind === 'RADIO'`, `about`/`links`/
  `subscribe` blocks are dropped from the rendered list regardless of what
  an older saved layout has marked visible, and a `programming` block is
  always injected if the layout doesn't already have one. New `programming`
  case in `renderBlock`: shows `nextBroadcastAt`/`nextBroadcastNote` when
  present ("No broadcast currently scheduled" otherwise) plus a
  `View full schedule →` link to the existing station-wide `/schedule`
  grid (`RadioScheduleView.tsx`). The whole per-channel styling pipeline
  (header style, backdrop, `ChannelDesigner`) is untouched — falls out for
  free since `tahti-radio` is just another row fetched by `fetchChannel(slug)`
  at the existing `/channel/$slug` route (no new route needed).
- Verified live in the browser (`VITE_FORCE_MOCK=1` dev server):
  `/channel/tahti-radio` shows the Programming block, no About/Links/
  Subscribe; `/channel/northern-lights` (ordinary artist) is unaffected —
  About + Subscribe still show, no Programming block. "View full schedule →"
  correctly navigates to `/schedule`.
- `tsc --noEmit`, `eslint`, full `vitest run` (516/516, only the
  pre-existing unrelated `HistoryRow` flake), and production `vite build`
  all pass.

## Not done / left open

- **Not committed/pushed yet in either repo.** `../tahti-org` has another
  live session working in it concurrently this session (`tahti-org-63`) —
  user said "go ahead, I'll coordinate" for the schema change itself, but
  committing/pushing there still needs the user's own go-ahead per this
  repo's cross-repo convention, and coordinating around the concurrent
  session. `tahti-player`'s branch `radio-channel-page` (based on
  `origin/master`) is ready to commit + push + PR once confirmed.
- **Programming block is a link-out + next-broadcast note, not an embedded
  per-station schedule.** `RadioScheduleView.tsx`'s 7-day grid is currently
  hardwired to the one global Tahti Radio booking calendar, not
  parameterized per arbitrary station — fine while `tahti-radio` is the
  only `RADIO`-kind channel, but a second radio channel would need that
  grid (or an equivalent) scoped per-channel to be a real "programming"
  view rather than a link to the same global grid. Backend/data-shape work,
  not attempted.
- **No admin/Channel-Designer UI to set `channelKind`** on a channel — only
  set via the migration's one-time backfill for `tahti-radio`. Fine for
  "initial" scope (no second radio channel exists yet); revisit if/when
  the product wants to create more radio channels.
- **The 6 external Finnish presets still have no page** — out of scope per
  the user's own scope decision above, not a gap in this pass.
