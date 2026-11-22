# More 3D visualizer variations, coloured by the artwork

**Status:** partial

Shipped 2026-11-22: `lib/artworkVisualizerScheme.ts` derives accent and highlight from the current track's cover; `ChannelVisualizer` `followArtworkColor` is on for the full-screen player, Jam, the track page and the artist/channel stage while playing. Left: the new presets (the user picks the list first).

## Request

Add more variations to the visualizations. The 3D ones work well, so make a few more different 3D presets. Colour each visualization from the artwork colour ambience.

## What exists

- Presets: `packages/tahti-web/src/plugins/visualizers/presets/` (aurora, cloudscape, particleField, reactiveGrid, waterRipple, lineTangle, fatLines, lensFlares, iesSpotlight, colorInstances, backdropBox/Area, interactivePoints, videoKinect, waveformBars). Registry and copy: `plugins/visualizers/index.ts`, `meta.ts`; contract in `types.ts` (`VisualizerPreset.build(scene, scheme, artworkUrl, camera)`), see `plugins/visualizers/README.md`.
- Host: `components/visuals/ThreeVisualizer.tsx`; scheme from `components/ChannelVisualizer.tsx` (`accent` falls back to a fixed `#22D3EE`).
- Artwork colour: `lib/useDominantColor.ts` (already drives the ambient track rows).

## To do

- [ ] Pick 3-4 new 3D presets that look clearly different from the current ones (ideas: tunnel / wormhole flythrough, terrain or wireframe landscape driven by the spectrum, orbiting rings / planet, instanced cube field that pulses on beats). Confirm the list with the user before building all of them.
- [ ] Artwork ambience: when a track has artwork, derive `accent` / `highlight` from its dominant colour (`useDominantColor`) and feed it into `VisualizerScheme`, so every preset (new and existing) follows the artwork; keep the channel scheme as the fallback.
- [ ] Each new preset: entry in `index.ts` + `meta.ts`, reduced-motion behaviour, a test like `waveformBars.test.ts` where logic is testable, and a Storybook story.
- [ ] Check performance on a mid-range phone (frame time) before shipping.
