# Local files: moved from right sidebar to a Library tab

**Status:** done (2026-09-05) for the move; "desktop mode" gating
flagged below as not actually implementable in this codebase today.

## What shipped

- `LibraryView.tsx`: added a new "Local files" tab (`LIBRARY_SECTION_TABS`,
  `FolderIcon`) alongside Sounds/Collections/Recordings/Media/Stash/
  Embeds/Smart links, rendering `DesktopLibraryPanel` (the existing
  "Add audio files" picker + track list, unchanged). New route
  `/library/local` registered in `router.tsx` (`libraryLocalRoute`,
  same pattern as the other `/library/*` routes).
- `RightRailPanel.tsx`: removed the "Library" tab entirely — the
  collapsed icon-rail tab, the expanded labeled tab, the
  `DesktopLibraryPanel` content-switch branch, `'library'` from
  `DESKTOP_TABS`, the now-unreachable mobile auto-switch-away `useEffect`,
  and the now-unused `LibraryIcon`/`useLocalLibraryStore` imports.

## Not done: "show that tab only in desktop mode"

Investigated and this can't be implemented as asked without a larger
decision first: **`tahti-web` (this web client) and the Tahti Player
desktop app (`packages/player`, a Tauri app) are two entirely separate
codebases that don't share a runtime** — confirmed via
`content/help.ts`'s own `desktop-mcp` article, which states outright
"This is a separate app, not this website... a browser tab can't host
the local server an AI tool connects to." Grepped for
`__TAURI__`/`isTauri`/`@tauri-apps` across `tahti-web`: zero matches:
there is no existing "am I running inside a desktop shell" signal in
this codebase to gate on. `DesktopLibraryPanel`'s own local-file import
already works via the standard HTML File API in any browser (its own
copy states "Audio blobs clear on reload — choose the same files again
to play"), so it was never actually desktop-exclusive at a technical
level either.

Left the new "Local files" tab visible unconditionally (same visibility
it already had in the right sidebar, just relocated) rather than
inventing a fake desktop check that would always evaluate false, or
silently reinterpreting "desktop mode" as viewport width (which is what
the *removed* sidebar tab was already doing via `!isMobile`, and
presumably not what was meant given the report). If real desktop-mode
gating is wanted, it needs either: (a) `tahti-web` actually being
embedded in a Tauri shell at some point (a bigger, separate effort), or
(b) a simpler proxy the user is fine with (e.g. a manual "I'm on
desktop" preference toggle, or gating on window width as a rough
proxy) — needs a decision, not a guess.

## Also found, not touched

`layoutStore.ts` has a `toggleLibraryRail` action and `'library'` still
in the `RightRailTab` type, referencing the now-removed sidebar tab —
but grepping the whole `tahti-web` tree found **zero callers** of
`toggleLibraryRail` anywhere, so it was already dead code before this
change, not something this change orphaned. Left as-is since fully
purging it means touching `layoutStore.ts`'s type and several
conditionals unrelated to what was asked; flagging for a future
cleanup pass rather than doing it opportunistically here.

## Verification

`tsc --noEmit`, `eslint`, `pnpm --filter @tahti-player/tahti-web test`
(467 tests, all passing), and `pnpm --filter @tahti-player/tahti-web
build` all pass. Not manually verified in a running browser.
