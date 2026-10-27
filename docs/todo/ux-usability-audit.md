# UX / usability audit (PR #1568) — verified

**Status:** open

Checked every finding in [#1568](https://github.com/janiluuk/tahti-player/pull/1568)
(`docs/AUDIT-UX-USABILITY.md`) against master on 2026-10-27. Only what holds
up is listed under "To do"; the rest is recorded with the reason so it isn't
re-filed.

## To do (verified)

- [ ] **`useScheduleForm` holds 29 `useState` calls.** A reducer would make the
  editor's state easier to follow. Refactor only; no user-visible bug found.
- [ ] **`React.memo` on hot `@tahti-player/ui` components** — 7 components already
  use `memo`. Profile a data-dense view (Library tracks, Studio sounds) before
  adding more; no measured problem yet.

## Not applicable or incorrect

- **All `packages/player` findings** (Album / PlaylistDetail / PlaylistImport
  ViewShell, TopArtistsWidget, HistoryBody loader, Settings/Sources states,
  AlbumHeader / ArtistBioHeader headings and `<img>`, Search retry pattern,
  PlaylistsToolbar, ArtistSimilarArtists, desktop route code splitting,
  SoundProvider, PluginStore virtualization): the desktop app has mounted
  tahti-web since 2026-09-01 (`packages/player/src/main.tsx` calls
  `mountTahtiApp`; `index.html` loads only `main.tsx`). Nuclear's views are
  never rendered, so fixing them changes nothing for users. Removing that dead
  UI is the useful follow-up, not polishing it.
  - 2026-10-27, removal 1/5 (`chore/batch-90-dead-ui-shell`): Nuclear's app
    shell (`App`, `initPlayerApp`), file routes, `routeTree.gen.ts`, devtools,
    integration tests and the view tests that mount the whole app.
  - 2026-10-27, removal 2/5 (`chore/batch-90-dead-ui-views`): every view under
    `packages/player/src/views/` (Album, Artist, Dashboard, Favorites,
    History, Playlists, PlaylistDetail, PlaylistImport, Search, Settings,
    Sources, Plugins, Themes, Logs, ...), the settings modal and top bar that
    mounted them, and `public/logo-icon-on-white.png`.
  - 2026-10-27, removal 3/5 (`chore/batch-90-dead-ui-components`): Nuclear's
    shared components (player bar, queue, sound provider, search box, ...),
    hooks, global shortcuts, the old remote-control client, and
    `shortcutsStore`.
- **Auth flows' `.catch(() => undefined)`** (`VerifyView`, `ResetPasswordView`,
  `SetupPasswordView`): incorrect. `authStore` sets `error` before rejecting and
  each view renders it with `InlineError`; the catch only stops an unhandled
  rejection.
- **recharts in the startup bundle**: already split. `HistoryCharts` load with
  the lazy Library route (`routes-library.tsx`) and build into their own chunk.
- **Desktop ↔ web parity table**: describes Nuclear's desktop UI, which no
  longer ships; the desktop app has the web feature set.
