# Tahti Radio admin playlist manager

**Status:** partial

## Goal

Editable curated playlist under Admin → Radio → Playlist, backed by
`/api/admin/tahti-radio/*` (separate from Tahti Selects).

## Done in this PR

- Admin client: list / browse / add / remove / reorder against the new admin API (+ mocks)
- Playlist tab + `TahtiRadioPlaylistPanel` (add dialog, confirm remove, optimistic reorder)
- Feature tab summary + Open playlist (no Selects empty CTA)
- Shared `TahtiRotationPlaylistEditor` i18n, busy, now-playing highlight + Storybook states

## Sibling

- tahti-org#1115 merged: shared curated-rotation helper + Radio admin routes/tests

## Left

- Deploy org API before relying on live playlist edits
- Optional: thin SelectsTab onto the same add-dialog wiring
