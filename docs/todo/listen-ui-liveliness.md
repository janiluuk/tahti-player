# Listen UI liveliness — multi-hue accents, depth, per-entity tint

**Status:** open

2026-10-19 sweep (`tahti-web` + `tailwind-config` + `themes`). The UI collapses almost
everything onto `primary` (teal-green) + gray `foreground`, so screens read as a uniform
green wall; several surfaces are fully flat (no accent, no elevation, no tint). A full
7-hue accent toolkit already exists but is mostly unused.

## Evidence

**Token headroom already available**

- `packages/tailwind-config/global.css:34-48` — `--accent-{green,yellow,purple,blue,orange,cyan,red}` + `-strong` vars exist; UI uses effectively green + red.
- `global.css:80` — `--shadow-float` soft elevation token; used rarely.
- `presets.ts:66-102` — the effective default theme `custom:nuclear-green` defines **zero** `accent-*` overrides; every accented element falls back to stock pastels (`global.css:116-135`) instead of a tuned duotone.
- Reference patterns that already work: `tahti-dark.css:53-56,82-104` (two-hue `--discover-glow-primary/secondary`), `ChannelView.tsx:270-288,567-578` (per-entity `colorScheme` duotone header + backdrop), `DiscoverView.tsx:327` + `DiscoverGatewayBackground.tsx:15-29` (ambient multi-hue layer).

## Tasks

1. **Tune the default theme's accents** — give `custom:nuclear-green` (`presets.ts:76-90`)
   real `accent-*` overrides + a `--discover-glow-*` pair like `tahti-dark.css:55-56`, so
   accented elements stop falling back to unthemed stock pastels.
2. **De-green the uniform layer** — `Card.tsx:62` (every Listen card is `bg-primary`),
   `Button.tsx:13` (every primary action same fill + same hard shadow),
   `MediaArtwork.tsx:295-318` (hover play overlay is the single green on every artwork).
   Push toward neutral fills + context-specific accent (pattern: `ChannelView.tsx:273-288`).
3. **Vary the hard-wired purple section pills** — `ListenSection.tsx:51` and
   `CardsRow.tsx:66` both use `Badge variant="pill" color="purple"`; key the hue to the
   section meaning (live = green, radio = cyan, history = amber) instead of one hue rail.
4. **Depth on flat surfaces** — `ListenView.tsx:658-666` (New tracks heading is bare gray),
   `HistoryStatsSection.tsx:149,164,190` + `HistoryListSection.tsx:176-211` (monochrome
   stats tabs, no active-row accent), `CollectionView.tsx` (zero accent/gradient; tint the
   header off the collection cover + `shadow-float` the track list). Reuse
   `DiscoverGatewayBackground` on flat surfaces where it fits (currently Discover-only).
5. **Verify across themes** — `custom:tahti-blue`, `custom:spotify-dark-theme` define all 7
   accents (presets.ts:30-36, 122-128); after 1-4, check no surface hard-codes a hue that
   breaks under them.

## Verify

- Storybook: Card, Badge, CardsRow, MediaArtwork, ListenSection stories in all 5 stock themes.
- Live: `VITE_FORCE_MOCK=1 pnpm dev:tahti` — Listen, History, Collection, Discover.
- Snapshot digest on PR (visual diff is the acceptance check for theme changes).
