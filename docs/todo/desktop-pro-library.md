# Independent desktop player — pro library, Soulseek, Tahti chrome

**Status:** open

Roadmap item: independent music player with pro management features and
Soulseek integration. Durable plan lives here and in
`packages/tahti-web/UI-REDESIGN-WORKLOG.md` (2026-09-04 — Independent
desktop player).

**Vision:** Desktop layout (not mobile bottom-nav). Local catalog + metadata
DB in the **right rail**. Import own tracks into the shared player. Soulseek
via a connectivity widget (search → download → import). Storybook chrome:
`TitleBar` + `TopBar` with **Tahti** branding only — no Nuclear logo or name.
Persistent chrome stays. Not another Listen widget strip.

**Platform:** Browser cannot speak Soulseek or watch folders. Tauri desktop
(or sidecar) is required for filesystem watch + Soulseek. Web can host UI +
cloud archive; local/Soulseek **gate on native capability**. Do **not** host
Soulseek searches on Tahti servers. Legal copy (help + settings) before
shipping Soulseek UI.

Storybook primitives: `TitleBar`, `TopBar`, `TahtiLogo`, `TrackTable`,
`MediaArtwork`, `EmptyState`, `Tabs`, `Input`, `Dialog`, `FilePicker`,
`PluginStoreItem`.

## Epics

| Epic | Scope | Status |
| --- | --- | --- |
| **F** | Player `TitleBar` + `TopBar` from Storybook; no Nuclear logo or wordmark | **F1 done** |
| **A** | Right-rail Library tab, desktop-only, persist width, deep links later | **A1–A3 done** (A4–A5 later) |
| **B** | Metadata DB (schema, SQLite/IndexedDB, extract, search, thumbs) | not started |
| **C** | Import + play (FilePicker/drag-drop, blob playback, folder watch native) | **C1–C2 done** (C3 native later) |
| **D** | Soulseek: legal, Configure (test→save→enable), native bridge, registry | D stub in progress |
| **E** | Bulk ops, BPM/key filters, M3U/reveal-in-folder, virtualization, help | not started |

**Delivery order:** F (chrome) + A/B → C → cloud parity → Soulseek → E.

**v1 non-goals:** mobile Library-rail parity; replacing Studio Sounds;
server-side Soulseek; CardsRow for the panel list; defaulting the custom
title bar on until F2.

## F — TitleBar and header (no Nuclear)

The independent player must look like Storybook `Components/TitleBar` and
`Layout/TopBar`, not upstream Nuclear.

- **F1 (this slice):** `TitleBar` title is “Tahti Player” with **no atom logo**.
  `TopBar` uses Storybook `TahtiLogo` (star mark + TAHTI), not `TopBarLogo`
  (Nuclear atom). Tests/snapshots must not say “Nuclear”. Tahti Jam header
  says Tahti, not Nuclear. `TopBarLogo` stays in `@tahti-player/ui` as an
  unused Nuclear asset until a later orphan sweep (`Orphan:` on any leftover
  story).
- **F2 (later):** Consider defaulting `appearance.customTitleBar` on for the
  desktop player so Storybook title-bar chrome is the default window frame.
  Needs Tauri decorations + integration-test updates. Do not flip the
  default in F1.
- **F3 (later):** Installer/appstream/Flathub still ship `Nuclear_*` artifact
  names — out of this UI epic; track in release docs.

## A — Library rail

- **A1:** `RightRailTab` += `'library'`; Library tab on `RightRailPanel`;
  hide on `useIsMobile` (mobile drawer still shows chat/queue/notifications).
- **A2:** `DesktopLibraryPanel` with `EmptyState` + `FilePicker`.
- **A3:** Persist rail width; migrate `tahti-web-layout` persist to accept
  `'library'`.
- **A4:** Do **not** hijack Status Bar cloud sound count for local files.
- **A5:** Keyboard / Status Bar “open Library rail” later.

## B — Metadata DB

Schema, extract tags, search, thumbs, reconcile with cloud archive. Native
SQLite on desktop; IndexedDB is a web fallback for session metadata only.

## C — Import + play

- **C1:** Session-local import (File → blob URL → `TahtiPlayable`
  `kind: 'archive'`, `protocol: 'https'`). Persist metadata only; blobs die
  on reload (honest “re-import” by file name). **Done** — zustand persist
  drops `objectUrl`; panel disables play until the same file is chosen again.
- **C2 (done):** Play / queue through the shared player.
- **C3:** Folder watch + durable file URLs: native-only.

## D — Soulseek

Legal copy first. `PluginStoreItem` Configure: test → save → enable, native
bridge later. Browser cannot connect. Tahti does not relay P2P.

## E — Pro management

Bulk ops, BPM/key, M3U, reveal-in-folder, virtualized `TrackTable`, atlas.
