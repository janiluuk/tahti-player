# Two radio plugins: remove the duplicate or say how they differ

**Status:** open

User ask (2026-10-04): there are now two radio plugins. Remove the duplicate, or list what one does that the other doesn't.

## Candidates (not verified which pair the user means)

`packages/tahti-web/src/content/pluginHelpCatalog.ts` lists two radio add-ons:

- **Internet radio stations** (category Radio): adds the curated station catalog to the main player; enabled in Settings → Add-ons → Radio.
- **Internet radio URL** (category Import): plays any direct stream or M3U/M3U8 URL as a station.

There is also the Radio Browser directory card in the Radio add-on category (`components/plugin-store/radio-category/RadioBrowserDirectoryCard.tsx`) and "My radio stations" in Settings.

## Plan

- [ ] 1. Confirm with a screenshot or names which two entries the user sees as duplicates.
- [ ] 2. Write the comparison: what each one adds, where it shows up, what the other lacks.
- [ ] 3. Either merge them into one add-on with both abilities, or rename and re-describe them so the difference is clear. Update the plugin help catalog and `../tahti-registry` if an entry is removed (see `docs/agent/REGISTRY.md`).
