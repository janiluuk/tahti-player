# Mentions: extend `../tahti-org` API with real source links, remove client fallback

**Status:** open

Was a vague WORKPLAN one-liner ("Sibling archive mentions API — extend `../tahti-org` metadata, then remove artist-page fallback") with no discoverable anchor at a glance. Fully scoped this pass — it's a small, real, well-understood backend gap, not aspirational.

## The gap

`packages/tahti-web/src/api/mentions.ts`'s `PublicMention` type already has `sourceId`/`sourceTitle`/`sourceUrl` (all optional), and `ArtistView.tsx:1069` already does:

```ts
const href = mention.sourceUrl ?? `/u/${mention.mentioner.username}`;
```

The client was built ahead of the backend. `../tahti-org/apps/api/src/routes/profile/mentions.ts`'s `GET /api/v1/u/:username/mentions` only selects `{id, surface, createdAt, mentioner}` — it never sends `sourceId`/`sourceTitle`/`sourceUrl` at all, so **every** mention falls back to the artist-page link today, regardless of what was actually mentioned.

The data to fix this already exists: `Mention.sourceId` is a real column (`packages/db/prisma/schema.prisma:3131`, comment: `"bio userId | announcement id | release id | draft id"`). It's just not selected or resolved into a URL.

## What `sourceId` actually contains, per surface (traced every `recordMentions()` call site)

| `MentionSurface` | Call site | `sourceId` is | Real URL to resolve |
| --- | --- | --- | --- |
| `BIO` | `routes/me/profile.ts:246` | the bio owner's own `user.id` (same as `mentionerUserId` for this surface) | `/u/:username` of the mentioner — **identical to today's client fallback**. Not a bug to fix, just confirm and pass it through explicitly. |
| `TRACKLIST` | `lib/tracklist.ts:59` | a real `soundId` | Whatever the public track page route is (check current `../tahti-org` + tahti-web public route naming — not verified this pass) |
| `ANNOUNCEMENT` | `routes/me/chat.ts:116` | a real `announcement.id` | Whatever the public announcement page route is (not verified this pass) |
| `CHAT` | `routes/chat/message.ts:79` | a **synthetic composite string**: `` `chat:${channel.id}:${Date.now()}:${mentioner.id}` `` — not a real row id | Needs parsing (split on `:`, take the channel id) then a channel lookup to get its slug for `/chat/:slug` — messages themselves aren't individually addressable, so link to the channel's chat, not a specific message |
| `NEWSLETTER`, `RELEASE` | none found | — | Declared in the `MentionSurface` enum (`schema.prisma:570`) but **no `recordMentions()` call site exists for either** — either dead enum values or wired somewhere this pass's `grep` missed. Confirm before assuming they need handling. |

## Fix

1. In `../tahti-org`: `routes/profile/mentions.ts` — add `sourceId: true` to the `mention.findMany` select, then map each result to also include `sourceTitle`/`sourceUrl`, resolved per `surface` per the table above. Update `PublicMentionListSchema` (`@tahti/shared`) to include the new response fields (additive, should be non-breaking for any other consumer).
2. In `tahti-web`: no type change needed (`PublicMention` already has the fields). Once the backend reliably sends `sourceUrl` for every surface except `BIO` (where the fallback and the real value are the same thing), the `?? fallback` in `ArtistView.tsx` becomes dead for every surface but `BIO` — decide then whether to simplify it or leave it as a harmless safety net for any surface that ever ships without a resolver.
3. "verify notifications end to end" (the WORKPLAN line's own phrasing) — not investigated this pass; check whatever notifies a user of a new mention (`notifiedAt` column exists on `Mention`) actually uses/exposes the same source context, so the notification and the public mentions feed agree.

## Not done this pass, and why

`../tahti-org`'s main worktree (`/home/jani/workspace/tahti-org`) has another
session's uncommitted changes right now (`apps/api/src/routes/me/channel-look-extras.test.ts`,
`packages/shared/src/dto/visual-preset.ts`, plus an untracked todo file) —
editing there directly risks the exact concurrent-session collision this
repo's session already hit once today (see `docs/todo/HISTORY.md`,
"restored via a targeted `git checkout stash@{0}` — pattern" entries).
Whoever picks this up should use a **dedicated `tahti-org` worktree**
(the repo already has several: `cross-repo-cycle`, `plugin-registry-adapter`,
`pwyw-track-detail` under `../tahti-org-worktrees/`), not the shared main
checkout.

The public route paths for tracks and announcements also weren't verified
this pass — confirm those against real `../tahti-org`/`tahti-web` routing
before writing the resolver, don't guess.
