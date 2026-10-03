# Storybook parity and atlas refresh

**Status:** open

User ask (2026-10-03): bring every Storybook story in line with the real page (same elements, interactions via play functions), including the Channel Designer. Update the Tahti atlas navigation Mermaid graphs and recapture its screenshots.

## Findings (audit at master 454d1645)

- Most page stories render the real views in forced mock mode, so drift lives in the shared mock fixtures (`packages/tahti-web/src/api/mock.ts` and friends). There is no per-story data override. Recent fields are null or missing, so the new UI never renders.
- Only 7 play functions, with no assertions. Storybook is built in CI but plays never run.
- No story for ArtistView, SmartLinkView, CollectionView, MessagesView, JamView, RadioShowView, ListenView, DiscoverView, SettingsView, StudioShowDetailView, StudioReleaseDetailView or StudioEventCreateView. 16 Channel Designer panels and 13 `channel-view/*` blocks have no story.
- `packages/tahti-web/STORYBOOK-SURFACES.md` is stale. `tw/RadioBrowserDirectory`, `tw/ElementLocations` and `tw/PageTourSpotlight` are hand-rolled.

## Plan

- [ ] 1. Infra: per-story mock-data overrides, play/`expect` helpers, `@storybook/addon-vitest` with a CI step, and Chrome, Player and ui primitive plays. Regenerate STORYBOOK-SURFACES.md.
- [ ] 2. Channel Designer: stories for the missing panels, plays for tabs, presets, reset and layers, plus the missing args.
- [ ] 3. Channel page blocks, chat (ChatNotice states), radio show, schedule, jam and DMs.
- [ ] 4. Artist page (all `artist-view/*`), SmartLinkView, CollectionView, Listen and Discover.
- [ ] 5. Track page (`track-detail/*`), track edit dialog tabs, downloads, tags and Studio release detail.
- [ ] 6. Studio shows, events, playlists and branding, plus Settings panels.
- [ ] 7. Admin tabs and dialogs, plus auth pages.
- [ ] 8. Atlas: update `src/content/flowDiagrams.ts` Mermaid graphs and `src/content/mapScreens.ts` cases for features shipped since the last refresh (#147). Recapture `public/map/nuclear/` with `scripts/capture-map-screens.mjs` in mock mode, dark and light.
