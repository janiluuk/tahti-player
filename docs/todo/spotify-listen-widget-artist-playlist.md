# Listen widget: Spotify artist or playlist

**Status:** open

**Start after:** Admin Workers empty-lane warning + hearthis-export
`clearFinishedJob` PRs land (lane-handoff leftovers).

## Ask

As a listener, I should be able to add a Listen widget for a **Spotify
artist** or a **Spotify playlist** (paste an `open.spotify.com` artist or
playlist URL, or pick one after connecting Spotify).

## Notes

- Playlist track rows for an existing Spotify Listen widget already shipped
  (HISTORY 2026-10-19, org #876 / player #1387). This ask is about **adding**
  artist- and playlist-scoped widgets from Listen → Add widget, not only
  tracks inside a widget that already exists.
- Check `listenerWidgetsStore`, the Listen widgets add dialog, and any
  Spotify import/OAuth paths in `../tahti-org` before inventing a second
  catalog.

## Done when

- From Listen, a user can add a widget pointed at a Spotify artist URL or
  playlist URL.
- The widget shows useful content (artist top/catalog or playlist tracks)
  without a dead embed.
- Invalid or unsupported Spotify URLs get a clear error, not a silent fail.
