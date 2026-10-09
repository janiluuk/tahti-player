# Storybook parity and atlas refresh

**Status:** partial

User ask (2026-10-03): bring every Storybook story in line with the real page (same elements, interactions via play functions), including the Channel Designer. Update the Tahti atlas navigation Mermaid graphs and recapture its screenshots.

## Findings (audit at master 454d1645)

- Most page stories render the real views in forced mock mode, so drift lives in the shared mock fixtures (`packages/tahti-web/src/api/mock.ts` and friends). There is no per-story data override. Recent fields are null or missing, so the new UI never renders.
- Only 7 play functions, with no assertions. Storybook is built in CI but plays never run.
- No story for ArtistView, SmartLinkView, CollectionView, MessagesView, JamView, RadioShowView, ListenView, DiscoverView, SettingsView, StudioShowDetailView, StudioReleaseDetailView or StudioEventCreateView. 16 Channel Designer panels and 13 `channel-view/*` blocks have no story.
- `packages/tahti-web/STORYBOOK-SURFACES.md` is stale. `tw/RadioBrowserDirectory`, `tw/ElementLocations` and `tw/PageTourSpotlight` are hand-rolled.

## Done so far

- Infra (#471): per-story mock-data overrides, play/`expect` helpers, `@storybook/addon-vitest`, plays run in CI (four shards since #481).
- Track page, track edit dialog, downloads, tags and Studio release detail (#475).
- Artist page, SmartLinkView, CollectionView, Listen and Discover (#476).
- Atlas (2026-10-04): Mermaid graphs and screen cases refreshed (#472, then the support, reports and moderation graph), and every screenshot recaptured in the Spotify theme, dark and light.

## Plan

Tracked as slices 11–15 in [`next-twenty-slices.md`](next-twenty-slices.md):

- [ ] 1. Chrome, Player and ui primitive plays (#474 was closed unmerged).
- [x] 2. Channel Designer: stories for the missing panels, plays for tabs, presets, reset and layers, plus the missing args.
- [ ] 3. Channel page blocks, chat (ChatNotice states), radio show, schedule, jam and DMs.
- [ ] 6. Studio shows, events, playlists and branding, plus Settings panels.
- [x] 7. Admin tabs and dialogs, plus auth pages.
