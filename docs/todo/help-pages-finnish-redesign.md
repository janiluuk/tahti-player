# Help pages: Finnish articles and visual redesign

**Status:** partial

Shipped in this pass:

- `/for-artists` is its own page (`ForArtistsView`, copy in `content/forArtists.ts`, English and Finnish) built from the README "For artists" facts.
- Help hub and articles redesigned: colour-coded groups (`content/helpUi.ts`), icon headers, "In short" callout, numbered section cards, checklist lines.
- All 26 help articles in Finnish (`content/help.fi.ts`, index-aligned with `help.ts`; a test checks the section counts). Hub chrome uses `helpHub.*` / `helpView.*` i18n keys.
- English / Suomi toggle on help and For artists pages drives the same `languageStore` choice as Settings → Language.

Left:

- Native-speaker review of the Finnish article copy. The Help add-ons table already follows the language (`pluginHelpCatalog.fi.ts`, one Finnish row per add-on). For artists has no separate add-on table.
- Plain-language rewrite of the English article copy (separate pass).
- ~~The old For artists claims not in the README (membership price, fee split, FLAC tier, Revelator, surplus grants) were dropped; product to confirm which are current before adding them back.~~ Help earnings no longer hard-codes euro fee amounts; membership points at Settings → Membership.
