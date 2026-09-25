# Port the Nuclear queue bar to tahti-web

**Status:** open

Logged 2026-09-25 from a user request: port the queue bar from the Nuclear (desktop) player and replace tahti-web's current right bar with it. The pieces must also be available as Storybook components.

Reference: the right-hand queue column in `~/Pictures/listen.png` and `~/Pictures/history.png` (header with collapse, clear-queue and more buttons; compact rows with artwork, title and artist).

## Current state

- Desktop: `packages/player/src/routes/__root.tsx` → `PlayerWorkspace.RightSidebar` → `packages/player/src/components/ConnectedQueuePanel.tsx`, built on `QueuePanel` / `ReorderableQueueItem` / `QueueReorderLayer` from `packages/ui/src/components/QueuePanel/`.
- Web: `packages/tahti-web/src/components/RightRailPanel.tsx` (262 lines) is a tabbed rail (Chat / Notifications / Queue), mounted from `AppShell.tsx`; its Queue tab wraps `QueuePanel` via `SidebarQueuePanel.tsx`. On the Listen tab it now opens on Queue when chat would be empty.
- Storybook already has `QueuePanel`, `QueueItem`, `QueueItemPopover` and `TahtiJamQueue` stories.

## Plan

- [ ] Compare the desktop right sidebar with the web rail side by side (collapse/expand, width, header actions, empty state, item menu, reorder, current-item highlight).
- [ ] Decide where Chat and Notifications live once the rail becomes the queue bar (keep them reachable; don't drop features). Confirm with the user before removing the tabs.
- [ ] Extract any desktop-only queue-bar chrome into `@tahti-player/ui` so web and desktop share it; no hand-rolled primitives.
- [ ] Replace `RightRailPanel` in `AppShell` with the shared queue bar wired to `playerStore`; keep persistent chrome rules (`packages/tahti-web/AGENTS.md`).
- [ ] Storybook: stories for every new or changed component (default, empty, loading, long queue, collapsed; flag `Missing states:`).
- [ ] Playwright check across member / Studio / Admin contexts (nav change), update `docs/VIEW-CATALOG.md`, `pnpm lint && pnpm type-check && pnpm test`.
