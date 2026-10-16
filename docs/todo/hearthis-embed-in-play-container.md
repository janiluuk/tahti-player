# hearthis embed inside play-control container

**Status:** partial

## Problem

Playing a hearthis.at track mounts `HearthisEmbedSurface` as a full-width strip above `ConnectedPlayerBar` (“Playback is controlled by the hearthis.at widget.”), disconnected from the Library row play control.

## Done in code

1. `SoundRow` / `EmbedTrackRow` host compact `HearthisEmbedSurface` beside/in the play-control box when that track is current.
2. `HearthisEmbedHost` claim so `ConnectedPlayerBar` does not also mount an iframe.
3. Removed the full-width strip + caption; fallback is a contained widget in the PlayerBar left cluster only when no row hosts it.

## Left

- Visual check on Library Tracks with a real hearthis cover / play.

## Done when

- Library Tracks: embed sits next to the row play button; no strip above the green bar.
- hearthis still drives playback (iframe mounted once).
