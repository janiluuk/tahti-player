# Library is for listeners; artist catalog moves to Studio

**Status:** open

User decision 2026-11-11. This settles navigation-simplification slice 1
and the Library target in
[`simplify-studio-library-settings-admin.md`](simplify-studio-library-settings-admin.md).

## Decision

Library is where a listener keeps things, and where the desktop app browses
the local library. Artist work moves to Studio. Change the navigation to
match.

Favourites stays a Library tab (`/library/favorites`). Signed-out account
areas stay visible and inert. Do not add a login screen to reach them
(`docs/DECISIONS.md`).

## Move to Studio

These Library tabs are artist tools today (`ARTIST_ONLY_TABS` in
`views/LibraryView.tsx`, plus Collections, which is catalog):

- Sounds (`/library/sounds`)
- Collections (`/library/collections`)
- Upload (`/library/upload`)
- Recordings (`/library/recordings`)
- Smart links (`/library/smartlinks`)

They belong under Studio → Music (Releases, Tracks, Collections, Editor),
with Upload as the primary action and Recordings reached from Broadcast,
as in the simplify plan. Old Library URLs redirect.

## Library keeps

Listener storage, on the web and in the desktop app:

- Overview, Favorites, History, Following
- Playlists and other items the listener saved
- Files they stored (Stash, Media)
- Desktop: browse the local library (`/library/local`,
  `DesktopLibraryPanel`)

A listener does not see artist catalog tabs. An artist uses Studio for
those, and Library the same way a listener does.
