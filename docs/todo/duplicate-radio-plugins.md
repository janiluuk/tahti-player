# Two radio plugins: remove the duplicate or say how they differ

**Status:** partial (help copy disambiguated 2026-10-05)

User ask (2026-10-04): there are now two radio plugins. Remove the duplicate, or list what one does that the other doesn't.

## Difference (confirmed)

| Surface | Help catalog name | What it does |
| ------- | ----------------- | ------------ |
| Import tool (`id: radio`) | **Paste radio stream URL** | Artist pastes one M3U/M3U8/direct URL; client-side playback only — no search API |
| Radio add-on | **Curated internet radio stations** | Enables the curated station catalog in the main player (Add-ons → Radio) |

Also related (not duplicates of the above): Radio Browser directory card and “My radio stations” in Settings.

## Plan

- [x] 1. Confirm the two Import vs Radio entries and write the comparison.
- [x] 2. Rename/re-describe in `pluginHelpCatalog.ts` so the difference is clear.
- [ ] 3. Optional later: merge into one add-on with both abilities, or drop one from the Store if product decides they should be one surface. Update `../tahti-registry` if an entry is removed.
