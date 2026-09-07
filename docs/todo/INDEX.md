# docs/todo — open work index

Agents: read this file instead of listing or skimming all of `docs/todo/`.  
When a task is finished → fold into [`HISTORY.md`](HISTORY.md), delete the todo file, update this index, and remove finished checkboxes from `WORKPLAN.md` / other active trackers.

Status values: `open` | `blocked` | `partial`.

| Status | File | One-line |
| --- | --- | --- |
| partial | [mobile-player-nav-and-tahti-theme-visuals.md](mobile-player-nav-and-tahti-theme-visuals.md) | Mobile player+nav stack shipped; thumbnail glow + Discover BgCanvas remain |
| partial | [channel-designer-background-section-fixes.md](channel-designer-background-section-fixes.md) | Designer background section; design decision remains |
| blocked | [channelview-move-player-to-stage.md](channelview-move-player-to-stage.md) | Player-in-backdrop extraction needs a design decision |
| open | [desktop-pro-library.md](desktop-pro-library.md) | Independent desktop player / library / Soulseek |
| partial | [go-live-header-subtext-cleanup.md](go-live-header-subtext-cleanup.md) | Calendar view restore still open |
| open | [governance-gap-list.md](governance-gap-list.md) | Governance features missing from tahti-player (16 gaps vs tahti-org; 2 already shipped) |
| partial | [image-upload-hover-lightbox.md](image-upload-hover-lightbox.md) | Shared chrome done; remaining surfaces |
| partial | [local-files-moved-to-library-tab.md](local-files-moved-to-library-tab.md) | Move done; desktop-mode gating open |
| partial | [listener-purchase-flow.md](listener-purchase-flow.md) | Subscription cancel shipped 2026-09-07; Purchases tab + e2e still open |
| partial | [pay-what-you-want-pricing.md](pay-what-you-want-pricing.md) | Buyer amount dialog shipped; not live-verified (no tier ever exists to test against) |
| open | [purchase-tier-artist-editor-missing.md](purchase-tier-artist-editor-missing.md) | One-time track purchases have zero artist-facing UI — tier create/edit + per-track assignment |
| open | [plugin-registry-extraction.md](plugin-registry-extraction.md) | Pointer to sibling extraction checklist |
| open | [queued-ux-fixes-2026-09-05.md](queued-ux-fixes-2026-09-05.md) | Queued UX: 3 open — designer tabs feature (2 items, scoped-out), full-player back arrow (needs live repro), Library missing tracks (needs live repro; wrong-tabs half fixed 2026-09-07) |
| partial | [radio-browser-directory-fixes.md](radio-browser-directory-fixes.md) | Cover-image sub-ask needs decision |
| partial | [stream-overlay-auto-fill-and-avatar-placeholder.md](stream-overlay-auto-fill-and-avatar-placeholder.md) | Now-playing artwork remaining |
| open | [continue-listening-card-missing-isplaying.md](continue-listening-card-missing-isplaying.md) | Listen page "Continue listening" card never shows pause icon |
| open | [mobile-topbar-notifications-messages-to-user-menu.md](mobile-topbar-notifications-messages-to-user-menu.md) | Move Notifications/Messages into user menu on mobile only |
| partial | [stream-overlay-text-color.md](stream-overlay-text-color.md) | Scrim backend shipped (../tahti-org PR #459, awaiting merge); frontend toggle UI remaining |
| partial | [studio-emptystate-remaining.md](studio-emptystate-remaining.md) | Inline form hints + Settings-scope empties remain |
| open | [tahti-cli-tool.md](tahti-cli-tool.md) | CLI (gumroad-cli-inspired) wrapping api-client — list library items, maybe TUI player |
| open | [tahti-theme-refactor.md](tahti-theme-refactor.md) | Orange-everywhere Button/Select defaults, contrast, visualizer visibility + settings gate |
| partial | [viewshell-page-headers.md](viewshell-page-headers.md) | Cover-overlay Studio entity headers excluded |

## Fold rule (copy into CLAUDE / chat)

```
Done task → append summary to docs/todo/HISTORY.md → delete docs/todo/<file>.md
         → remove row from INDEX.md → strip finished items from WORKPLAN.md
Never leave **Status:** done files in docs/todo/.
```
