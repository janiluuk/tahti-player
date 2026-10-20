# Theme system: coverage and performance

**Status:** open

The audit (2026-10-20) traced two user reports:

- Some elements (the top search box among them) ignored theme changes.
- The theme system should be faster.

What shipped is in HISTORY under "Theme coverage and performance". The items below are what's left.

## How a theme reaches the page

1. `public/theme-boot.js` runs before any app JS.
   - It sets `data-theme-id` and `data-theme`.
   - For a custom theme it now paints the CSS cached in `tahti-theme-css`, as `<style id="advanced-theme-boot">`. The selectors get an `html` prefix so they beat `global.css`, which loads after it.
2. The store (`plugins/themes/store.ts`) rehydrates and calls `applyThemeToDocument`.
   - Basic theme: it sets `data-theme-id`.
   - Custom theme: it sets `data-theme-id` to `nuclear:default` and writes `<style id="advanced-theme">` from `advancedThemeCSS()`, which is memoised per theme object. It then removes the boot style.
3. Tokens resolve in this order:
   - `packages/tailwind-config/global.css` (`:root`, `[data-theme='dark']`)
   - `packages/themes/src/basic/*.css`
   - the generated custom-theme CSS. `withDerivedTokens` fills in `primary-foreground`, `primary-strong`, `secondary`, `secondary-foreground`, and the input background, text and border tokens from the theme's own palette.

## Open items

- [ ] **First-ever visit still flashes stock Nuclear.** Nothing is cached yet, so the default Gruvbox paints only once the app JS runs (about 1 s on a cold load). Fix: a `transformIndexHtml` plugin that inlines Gruvbox's generated CSS as `advanced-theme-boot`. `theme-boot.js` then removes it when the stored theme is a basic one.
- [ ] **Basic light themes keep some stock tokens.** Arctic Moss, Aurora, Ember and Lagoon in light mode don't set three tokens:
  - `--background-secondary` (white top bar and sidebar)
  - `--foreground` (Nuclear navy)
  - `--border` (black)

  It's a design call whether to tint them. The input background now follows each theme's `--secondary`.
- [ ] **Custom themes depend on source order.** The generated `:root{…}` has the same specificity as `global.css` and wins only because it is appended later. A lazily loaded CSS chunk that redefines tokens would override it. Consider emitting `html:root` / `html[data-theme='dark']` from the generator, as the boot style does.
- [ ] **Legacy storage keys.** `tahti-nuclear-theme-id` and `tahti-nuclear-dark` are still written (now only when they change) and read by both `merge` and `theme-boot.js`. In the boot script the legacy dark key overrides the zustand bag. Drop them after a migration window.
- [ ] **Presets are bundled eagerly.** The 22 preset themes are about 55 KB raw (10 KB gzipped) inside the `TahtiApp` chunk. The community presets could be a lazy chunk, loaded by Settings → Themes or when one is active. Low priority.
- [ ] **The dynamic-mode interval runs in every mode.** It's a 5-minute `setInterval` that returns early unless the mode is `dynamic`. Start it only in dynamic mode, and stop it when the mode changes. Negligible cost.
- [ ] Verify Card / Badge / CardsRow / MediaArtwork / ListenSection stories in all stock themes. This item moved here from `ux-backlog.md`.

## Measured (mock dev server, Gruvbox Light)

| | Before | After |
| --- | --- | --- |
| `tahti-web-theme` localStorage entry | 46.7 KB (every preset copied in), rewritten on each change | 101 B (user themes and renamed presets only) |
| Theme DOM writes at startup | 6 (3 × `data-theme-id` + `<style>`) | 1 |
| Repeat visit, custom theme | stock Nuclear until app JS | theme painted by `theme-boot.js` (verified on a production build with app JS blocked) |
