# Library Tracks: embed layout + ambient row backgrounds

**Status:** partial

## Problem

1. Playing a hearthis.at (embed-only) track from Library → Tracks (`/library/sounds` → `StudioSoundsView`) mounts `HearthisEmbedSurface` in `ConnectedPlayerBar` as a full-width panel above the bar. That chrome grows, collapses the workspace, and looks like the embed is eating the track list (search stays visible; rows disappear into the fold / black panel).
2. Track rows use flat `bg-background` / secondary stripes. They should pick up an ambient wash from each track’s cover (`bannerUrl`), same idea as the track detail / full-screen player dominant-color treatment.

## Done in code

1. `ConnectedPlayerBar`: skip waveform when embed-only (strip removed — see `hearthis-embed-in-play-container.md`).
2. `HearthisEmbedSurface` / `hearthisEmbedSrc({ compact })`: style-1 + forced iframe max height.
3. `SoundRow`: `useDominantColor(bannerUrl)` ambient wash, `MediaArtwork` thumb; hearthis widget hosts in the play-control box when current.

## Left

- Visual check on beta / mock with a real hearthis cover (`bannerUrl` present).
- Mock sounds now always get a picsum `bannerUrl` when fixtures omit art; Storybook `StudioSoundsView/AmbientCovers` asserts the row wash (batch 66 #3).

## Done when

- Playing an embed from Tracks leaves the list usable (filters + rows still in view).
- Rows show cover-derived ambient tint when `bannerUrl` is present.
