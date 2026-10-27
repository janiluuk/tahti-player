# UX / usability audit (PR #1568) — verified

**Status:** open

Checked every finding in [#1568](https://github.com/janiluuk/tahti-player/pull/1568)
(`docs/AUDIT-UX-USABILITY.md`) against master on 2026-10-27. Only what holds
up is listed under "To do"; the rest is recorded with the reason so it isn't
re-filed.

## To do (verified)

- [ ] **Radio: member relay failure is silent.** `RadioView.reload()` handles
  station, recent and featured errors, but `fetchRadio()` (the member live relay)
  has no error path, so a failed read just hides the relay. Recent, featured,
  rotation and upcoming already show per-section errors.
- [ ] **Two unselected Zustand subscriptions.** `ThemesPanel` (`useThemeStore()`)
  and `DesktopUpdatesRow` (`useDesktopUpdateStore()`) re-render on every store
  change. Use selectors. (The audit's `useFavoritesStore()` example is in the
  dead desktop UI, see below.)
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
- **Auth flows' `.catch(() => undefined)`** (`VerifyView`, `ResetPasswordView`,
  `SetupPasswordView`): incorrect. `authStore` sets `error` before rejecting and
  each view renders it with `InlineError`; the catch only stops an unhandled
  rejection.
- **recharts in the startup bundle**: already split. `HistoryCharts` load with
  the lazy Library route (`routes-library.tsx`) and build into their own chunk.
- **Desktop ↔ web parity table**: describes Nuclear's desktop UI, which no
  longer ships; the desktop app has the web feature set.
