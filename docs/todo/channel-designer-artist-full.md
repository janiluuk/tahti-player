# Channel Designer → artist page full control

**Status:** in progress (2026-09-04).

## Goal

Channel Designer can fully customize the public artist page: background,
header, player themes, gradients, and visualizations. Flag and implement
anything unwired or missing.

## Surfaces

- Designer: `packages/tahti-web/src/components/ChannelDesigner.tsx`
- Artist page: `packages/tahti-web/src/views/ArtistView.tsx`
- Look model: `packages/tahti-web/src/api/channel-design.ts`,
  `packages/tahti-web/src/lib/channelLookElements.ts`

## Checklist

- [ ] Audit designer controls vs artist-page consumption
- [ ] Background / backdrop
- [ ] Header styles
- [ ] Player themes
- [ ] Gradients
- [ ] Visualizations
- [ ] Flag remaining gaps in worklog
