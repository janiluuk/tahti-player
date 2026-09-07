# Admin → Artwork presets: modal editor + top-right actions

**Status:** open
(Later) — reported 2026-09-08, not investigated in depth.

## Ask

1. Clicking a preset item in the grid should open a **modal** with the
   editing/slot dialog, instead of the current inline section rendered
   below the grid — make it compact.
2. The grid should update live when the user uploads a new image or
   replaces an item (no full reload needed).
3. Add an "Add new" icon button to the top-right corner of the page.
4. Move "Reset to defaults" to an icon button next to "Create" (top
   right), and guard it with a confirm `Dialog` before reverting
   (currently a plain `Button` with no confirmation at all — a
   destructive action with no guard).

## Starting point

`packages/tahti-web/src/views/admin/AdminArtworkPresetsView.tsx` (251
lines): `resetToDefaults` (~line 124) is a bare function wired directly
to a `Button` (~line 138) with no confirm step. The grid
(`grid gap-3 sm:grid-cols-4 lg:grid-cols-8`, ~line 142) sits above a
second, always-mounted section (~line 163,
`border-border bg-background-secondary grid ...`) that holds the
selected-preset editor inline — that's the section to move into a
`Dialog`. `ArtworkPresetUploadDialog` (already imported) may already
cover part of the "add new" flow — check whether it can be reused
for the top-right "Add new" action before building a second upload
path.
