# hearthis embed inside play-control container

**Status:** partial

## Problem

Playing a hearthis.at track mounts `HearthisEmbedSurface` as a full-width strip above `ConnectedPlayerBar` (“Playback is controlled by the hearthis.at widget.”), disconnected from the Library row play control.

## Diagnosis

1. Master mounts the widget in `ConnectedPlayerBar` (viewport bottom) — that is the floating strip in the screenshot.
2. On this branch the row host used `w-full` inside a flex-wrap play wrapper, so the iframe could expand to a full content-width band instead of staying in the action cluster.
3. `useHearthisEmbedClaim` used `useEffect`, so the PlayerBar fallback could paint for a frame before the row claimed.

## Done in code

1. `SoundRow` / `EmbedTrackRow` host compact `HearthisEmbedSurface` inside the row action box (`sound-row-actions`) when that track is current.
2. `HearthisEmbedHost` claim via `useLayoutEffect` so `ConnectedPlayerBar` does not mount a bottom fallback when a row hosts.
3. Removed the full-width strip + caption; fallback is a contained widget in the PlayerBar left cluster only when no row hosts it.
4. Constrained embed (`max-h-28`, `w-[min(100%,18rem)]`, `overflow-hidden`, `contain-paint`) — no `w-full` escape.

## Left

- Visual check on Library Tracks with a real hearthis cover / play.

## Done when

- Library Tracks: embed sits next to the row play button; no strip above the green bar.
- hearthis still drives playback (iframe mounted once).
