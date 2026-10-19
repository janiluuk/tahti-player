# Spotify Listen widget → normal tracks

**Status:** partial

## Goal

Spotify Listen widget pastes a public playlist URL and renders tracks in
`PlayableTrackTable` (embed playback via player bar), not a Spotify iframe.

Example: `https://open.spotify.com/playlist/2esDahb3pYLC84NF3bWx98?si=…`

## Done

1. **tahti-org** — merged [#876](https://github.com/janiluuk/tahti-org/pull/876):
   `parseSpotifyPlaylistId` + `getSpotifyPlaylistTracks`;
   `GET /api/v1/imports/spotify/by-playlist-url`.
2. **tahti-web** — `fetchSpotifyPlaylistTracks`; Spotify
   `ListenerWidgetEmbed` → table; iframe fallback; compact dialog gear in
   accessory; full-width Spotify on Listen.

## Left

- Land player PR; deploy API (org main) + beta web; live-check example playlist.
