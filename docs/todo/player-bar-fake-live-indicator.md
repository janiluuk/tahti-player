# Player bar: LIVE indicator shows for radio/rotation streams, not just real live broadcasts

**Status:** open

User report (2026-09-06): the "LIVE" badge appears in the player bar and
full-screen player for radio stations that are just playing a 24/7
rotation, not an actual live broadcast. Should only show for a real
live stream.

## Where it renders

- `components/ConnectedPlayerBar.tsx:235` — `<PlayerLiveBadge />`, gated
  on `isLive` (`s.isLive` from `usePlayerStore`, line 31).
- `components/FullScreenPlayer.tsx:208-209` — `<PlayerLiveIndicator />`,
  same `isLive` (line 32).
- Both badge components defined in `components/PlayerSeekBar.tsx`
  (`PlayerLiveBadge` ~line 60, `PlayerLiveIndicator` ~line 42).

## Root cause

`stores/playerStore.ts` sets `isLive` from `item.kind`:

```ts
const isRadioOrLive = item.kind === 'live' || item.kind === 'radio';
...
isLive: isRadioOrLive,
```

`kind` comes from `playableFromQueueItem` and is derived purely from the
id prefix (`radio:` → `'radio'`, else `'live'`) — there's no signal here
distinguishing an actual live human broadcast from an always-on
rotation/radio stream. Every radio/live queue item gets `isLive: true`.

## What already exists (and doesn't help directly)

`lib/broadcastPresence.ts`'s `resolveBroadcastPresence({ signalConnected,
channelState })` already computes this exact distinction (`'live' |
'rotation' | 'preview' | 'offline'`, with the comment "Channel LIVE is
also used for 24/7 rotation. Only an ingest signal plus LIVE is a real
broadcast."). But it's wired up only for the **current user's own**
channel via `stores/broadcastPresenceStore.ts` +
`hooks/useOwnBroadcastPresence.ts`, fed by `/api/me/stream-settings/status`
(`fetchSignalStatus`) — an authenticated "my channel" endpoint.

The closest per-slug endpoint, `fetchChannelManageStats` (`GET
/api/channels/:slug/manage-stats`, returns `signalConnected`), is named
like a management/owner-only endpoint — needs confirming whether it's
actually reachable for an arbitrary listener tuning into someone else's
channel, or scoped to the owner/moderator only (check the backend in
`../tahti-org` before relying on it).

## Backend confirmed (read `../tahti-org`, did not edit — not asked to)

- `GET /api/channels/:slug/manage-stats`
  (`apps/api/src/routes/channels/manage-stats.ts:23,50-52`) is
  explicitly gated: `requireAuth` + `user.username !== channel.user.username
  && !user.isBoard` → 403. **Not usable by an arbitrary listener.**
- `GET /api/channels/:slug` (`apps/api/src/routes/channels/get.ts`,
  the public channel payload every listener-facing surface already
  polls) returns raw `channel.state` but nothing about ingest/signal —
  no `signalConnected` field anywhere in `computeChannelView`.
- **Confirmed `state: 'LIVE'` is genuinely overloaded, not just an
  edge case:** `apps/worker/src/jobs/channel-fallback-reconciler.ts:50`
  sets `state: 'LIVE'` the moment a channel's 24/7 fallback rotation
  container starts — completely independent of any human broadcaster.
  A channel sitting in permanent automated rotation is `state: 'LIVE'`
  indefinitely from the backend's point of view. So `channel.state`
  alone can never answer "is a person actually broadcasting right
  now" — confirms `signalConnected` (or equivalent ingest state) is
  the only real signal, and it currently has zero public exposure.

## What's needed (backend change required — not done, not this repo)

The public `GET /api/channels/:slug` payload (or a new public
endpoint) needs to expose a real/rotation distinction — e.g. a
`signalConnected: boolean` field alongside `state`, computed the same
way `manage-stats` already does via `fetchMountSignalStatus`, but
without the owner/board auth gate (or with the auth gate dropped only
for this one non-sensitive boolean). This is a `../tahti-org` change;
per this repo's own instructions, not made without being asked.

Once that field exists:
1. Thread it into `TahtiPlayable`/`QueueItem` when a channel is played
   (not just `kind`).
2. Compute a new player-store field (e.g. `isRealLive`) using
   `resolveBroadcastPresence`-style logic.
3. Swap both badge conditions (`ConnectedPlayerBar.tsx`,
   `FullScreenPlayer.tsx`) from `isLive` to that field.
4. Don't shortcut this by hiding the badge for `kind === 'radio'` —
   a rotation-only station and a channel genuinely being
   live-broadcast right now can share the same `kind`; the real
   distinguisher is ingest/signal state, not the id prefix.
