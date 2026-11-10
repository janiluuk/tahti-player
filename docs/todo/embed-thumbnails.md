# Embed thumbnails not working

**Status:** open  
**Updated:** 2026-11-10

## Problem

Thumbnails for embedded tracks (hearthis / Mixcloud / Spotify / Bandcamp /
SoundCloud embed rows, Library → Embeds / Sounds embed surfaces) do not show
correct artwork. Rows fall back to empty or default art instead of the
provider cover.

## Likely surfaces

- `EmbedTrackRow` / Library embeds list
- `SoundCloudEmbedsPanel` (`thumbnailUrl`)
- Studio Sounds rows with `embedProvider` + `bannerUrl`
- Public channel Embeds tab / embed playback cover

## Done when

- [ ] Reproduce: which providers fail (import vs SoundCloud panel vs channel)
- [ ] Fix fetch/persist of cover URLs (API and/or client mapping)
- [ ] Rows show provider artwork; failed load still uses default artwork, never blank
- [ ] Unit or Storybook coverage for at least one embed with a thumbnail
