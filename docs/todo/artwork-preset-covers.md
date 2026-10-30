# Artwork preset covers

**Status:** partial

Admin artwork presets live in the API (tahti-org#1033) with an enabled flag. Sounds, collections and channel owners created without cover art get an enabled preset saved as their cover; `apps/api/scripts/backfill-preset-covers.ts` patches existing items. Opening a cover slot offers Upload plus one gallery of enabled presets and the user's own uploaded images (`CoverArtPickerDialog`).

Left:
- [ ] Merge tahti-org#1033, then run the backfill on production (dry run first).
- [ ] Release artwork (Studio release detail) still uses its own upload flow; move it to the picker if wanted.
