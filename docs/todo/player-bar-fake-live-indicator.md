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

## What's needed

1. Confirm (in `../tahti-org`) whether any listener-facing endpoint
   returns real ingest/signal state for an arbitrary channel (not just
   "me"). If `manage-stats` is actually open to any viewer, it can be
   reused; if not, this needs a backend addition.
2. Once a per-channel real-live signal is available to the listener
   player: thread it into `TahtiPlayable`/`QueueItem` when a channel is
   played (not just `kind`), compute a new store field (e.g.
   `isRealLive`) using `resolveBroadcastPresence`-style logic, and swap
   both badge conditions (`ConnectedPlayerBar.tsx`,
   `FullScreenPlayer.tsx`) from `isLive` to that field.
3. Don't just hide the badge for `kind === 'radio'` as a shortcut — a
   station that's on a 24/7 rotation `LIVE` channel state and a channel
   that's genuinely being live-broadcast right now can share the same
   `kind`; the real distinguisher is ingest/signal state, not the id
   prefix.

Flagging rather than guessing at a workaround — needs the backend check
above before implementation.
