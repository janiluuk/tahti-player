# Listen UI liveliness — multi-hue accents, depth, per-entity tint

**Status:** partial

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

## Done

1. Tuned `custom:nuclear-green` accents + `--discover-glow-*` pair (`presets.ts`).
3. Section pills: `badgeColor` on `CardsRow` / `ListenSection`; Listen wires live=green, radio=cyan, history=yellow.
4. Partial depth: New tracks heading accent bar + `shadow-float` on the track table.

## Left

2. **De-green the uniform layer** — `Card.tsx` / `Button.tsx` / `MediaArtwork` play overlay toward neutral fills + context accent.
4. History stats/list active-row accent; CollectionView cover-tint header; optional DiscoverGatewayBackground on flat Listen surfaces.
5. Verify across `tahti-blue` / `spotify-dark-theme`.

## Verify

- Storybook: Card, Badge, CardsRow, MediaArtwork, ListenSection stories in all 5 stock themes.
- Live: `VITE_FORCE_MOCK=1 pnpm dev:tahti` — Listen, History, Collection, Discover.
- Snapshot digest on PR (visual diff is the acceptance check for theme changes).
