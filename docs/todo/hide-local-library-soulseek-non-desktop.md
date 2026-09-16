# Hide Local library / Soulseek from non-desktop (browser) builds

**Status:** open

## Request

Local library and Soulseek should not be visible/reachable when the app
is running as a plain browser build (not the Tauri desktop app).

## Current state

Both are fully visible today regardless of runtime:

- **Local library** (`/library/local`, `LibraryView.tsx` →
  `DesktopLibraryPanel.tsx`) intentionally has a **browser-only
  fallback**: `localLibraryStore.ts` imports via the browser File API
  (session-only blob URLs, no persistence across restart) when there's
  no native Tauri runtime. This was a deliberate design choice — see
  `docs/todo/desktop-pro-library.md` ("Cloud Sounds/Collections remain
  available alongside the local catalog", the browser fallback is
  "confirmed by design"). Hiding it entirely on non-desktop would be a
  reversal of that decision, not a bug fix — flag this to whoever picks
  the task up, in case the fallback has users depending on it.
- **Soulseek** (`packages/tahti-web/src/plugins/soulseek/SoulseekAddonCard.tsx`,
  surfaced via `PluginStorePanel.tsx`) is a P2P network integration that
  needs a native client/binary — almost certainly non-functional in a
  plain browser, but nothing currently gates its visibility in the addon
  store either.

## Existing mechanism to reuse

`packages/tahti-web/src/lib/nativeCapabilities.ts` already exposes
`hasNativePlayer()` / `getNativeCapabilities().localLibrary`, backed by
`globalThis.__TAHTI_NATIVE_CAPABILITIES__` (set by the Tauri shell,
`packages/player/src/main.tsx`). Today it's only used inside
`DesktopLibraryPanel.tsx` (line ~46) to pick a loading-state message —
not to gate visibility of the panel/nav entry itself. This is the
right check to gate on; no new capability-detection needs inventing.

## Open questions before implementing

- Does "hide" mean remove the nav entry entirely, or show a "desktop
  app only" placeholder? (Desktop-only features elsewhere in this repo
  — check for precedent.)
- Confirm the browser-fallback local library is actually meant to go
  away per the current product direction — `desktop-pro-library.md`
  treats it as intentional, so this may need a product decision, not
  just a UI gate, before removing it.
- Soulseek: does the plugin store itself run in the browser build at
  all, or only inside desktop? If the whole store is desktop-only
  already, this may already be covered for Soulseek and only Local
  library needs the gate.
