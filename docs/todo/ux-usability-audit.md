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
  - 2026-10-27 (batch 90): profiled `PlayableAmbientTrackList` (Favorites,
    Collections, Listen, artist likes) with 300 tracks while playing: every
    1 s progress tick re-rendered every row, median commit ~230 ms in jsdom.
    Memoized tahti-web's `AmbientTrackRow` and built the row props without
    the position, so a tick redraws only the playing row: ~2.9 ms. The
    `@tahti-player/ui` components weren't the hot spot; `TrackTable` (List
    view) and Studio sounds are not profiled yet.

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
- **Auth flows' `.catch(() => undefined)`** (`VerifyView`, `ResetPasswordView`,
  `SetupPasswordView`): incorrect. `authStore` sets `error` before rejecting and
  each view renders it with `InlineError`; the catch only stops an unhandled
  rejection.
- **recharts in the startup bundle**: already split. `HistoryCharts` load with
  the lazy Library route (`routes-library.tsx`) and build into their own chunk.
- **Desktop ↔ web parity table**: describes Nuclear's desktop UI, which no
  longer ships; the desktop app has the web feature set.
