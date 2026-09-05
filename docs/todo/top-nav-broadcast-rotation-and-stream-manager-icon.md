# Top-nav: rotation dot fix + Stream Manager quick-access icon

**Status:** done (2026-09-05).

## Bug found and fixed

`AppTopNav.tsx`'s collapsed broadcast icon computed `hasConnectionIssue`
as `user?.channel?.state === 'LIVE' && !broadcast.signalConnected` and
rendered it as a **red pulsing error** state. But per
`resolveBroadcastPresence` (`lib/broadcastPresence.ts`), a channel's DB
`state` reads `'LIVE'` both for a genuine live broadcast *and* for the
24/7 fallback rotation carrying the channel — only `signalConnected &&
state === 'LIVE'` is a real broadcast. So `hasConnectionIssue` was
mathematically identical to `broadcast.kind === 'rotation'`: the normal,
expected "rotation is playing, nothing is actually broadcasting" state
was being shown as an outage. This was caught because the *expanded*
dropdown (opened by clicking the icon) already rendered this same state
as informational (cyan, non-pulsing) — an internal inconsistency between
the collapsed icon and its own dropdown.

## What shipped

- Replaced `hasConnectionIssue`/`error` with an explicit `isRotation`
  (`broadcast.kind === 'rotation'`) branch rendering a **static** yellow
  dot — no pulse animation.
- `preview` (`hasBroadcastWarning`) also now renders static, not
  pulsing. Per the request ("only flash the top notification if user is
  live"), pulsing is reserved for `live` only.
- Applied the same tone mapping to the expanded dropdown's own status
  dot so collapsed and expanded states agree (previously the dropdown
  had its own separate cyan-for-rotation branch that predated and masked
  this bug).
- Added a `ListMusicIcon` "Stream manager" icon button next to the
  broadcast icon (desktop only, same visibility gate as the broadcast/
  upload icons: `user && hasChannel`). Clicking it opens
  `StreamManagerPanel` standalone inside a `Dialog.Root` modal (`max-w-xl`)
  — passes only `slug` and `channelState` from `user.channel`; no
  `onPlaybackToggle`/`onRotationChange`/`onEnded` wiring, since this is a
  quick-glance/control surface reached from anywhere in the app, not the
  Go Live page's fuller context. `StreamManagerPanel` degrades gracefully
  without those callbacks (the play/pause transport button in the header
  is gated on `onPlaybackToggle` being present, per
  `docs/todo/stream-manager-header-and-overlay-modal.md`).

## Verification

`tsc --noEmit`, `eslint`, and `pnpm --filter @tahti-player/tahti-web
build` all clean. Not manually verified in a running browser — the
rotation-vs-error dot color and the new Stream Manager modal are worth a
quick look once there's a way to see them live against a real rotation
channel.
