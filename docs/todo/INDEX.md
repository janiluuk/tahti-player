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
| partial | [governance-gap-list-top3.md](governance-gap-list-top3.md) | Admin governance consolidated under one tabbed page + attendance mgmt (#6) shipped; motion detail (#1) and public resolutions page (#3) remain |
| partial | [image-upload-hover-lightbox.md](image-upload-hover-lightbox.md) | Shared chrome done; remaining surfaces |
| partial | [local-files-moved-to-library-tab.md](local-files-moved-to-library-tab.md) | Move done; desktop-mode gating open |
| partial | [listener-purchase-flow.md](listener-purchase-flow.md) | Subscription cancel shipped 2026-09-07; Purchases tab + e2e still open |
| open | [plugin-registry-extraction.md](plugin-registry-extraction.md) | Pointer to sibling extraction checklist |
| partial | [release-player-workflow-broken.md](release-player-workflow-broken.md) | Root cause fixed 2026-09-07; user needs to run 2 `gh secret set` commands to finish |
| partial | [radio-browser-directory-fixes.md](radio-browser-directory-fixes.md) | Cover-image sub-ask needs decision |
| partial | [stream-overlay-auto-fill-and-avatar-placeholder.md](stream-overlay-auto-fill-and-avatar-placeholder.md) | Now-playing artwork remaining |
| partial | [studio-entity-edit-view-header-redesign.md](studio-entity-edit-view-header-redesign.md) | Collection edit header now uses EntitySocialHeader; Release/Playlist-editor headers + track-table swap + delete/export still open |
| partial | [studio-emptystate-remaining.md](studio-emptystate-remaining.md) | Inline form hints + Settings-scope empties remain |
| open | [tahti-cli-tool.md](tahti-cli-tool.md) | CLI (gumroad-cli-inspired) wrapping api-client — list library items, maybe TUI player |
| open | [tahti-theme-refactor.md](tahti-theme-refactor.md) | Orange-everywhere Button/Select defaults, contrast, visualizer visibility + settings gate |
| open | [waveform-detail-accuracy.md](waveform-detail-accuracy.md) | Full track view waveform needs real detail/accuracy — WaveformSeekbar downsamples to 64 bars, fabricates fake bars when no peaks |
| open | [archive-mentions-source-url.md](archive-mentions-source-url.md) | Mentions API never selects/resolves `Mention.sourceId` into a real link — every mention falls back to the artist page; fully scoped per-surface, needs a dedicated tahti-org worktree |
| open | [sounds-view-empty-in-prod-and-sort-redesign.md](sounds-view-empty-in-prod-and-sort-redesign.md) | Prod bug: user's library shows empty under Sounds (suspect silent fetch-failure swallowing); also move sort control into top bar using DropdownButton |
| open | [admin-panel-left-padding.md](admin-panel-left-padding.md) | Admin panel content has a big left gap — should start flush like other views; suspect `.admin-page-layout`'s 11rem grid column |
| open | [listen-widget-hearthis-config-and-set-embed-bug.md](listen-widget-hearthis-config-and-set-embed-bug.md) | (Later) Hearthis widget: auto-fill username from artist settings, icon-button config UI, fix broken set-embed add |
| open | [onboarding-toast-noise.md](onboarding-toast-noise.md) | (Later) "Finish your profile" toast: exempt seeded users, once-per-session even without explicit dismiss, mark done before screenshots |
| open | [sticky-theme-review-toast.md](sticky-theme-review-toast.md) | (Later) "Theme is in review" mock toast reappears every reload — mock dismiss is a no-op; same root cause as onboarding-toast-noise |
| open | [channel-designer-backdrop-fold-and-widgets.md](channel-designer-backdrop-fold-and-widgets.md) | (Later) Fold bio/CTA/avatar into backdrop show-toggles (not separate blocks); feed/posts as configurable widgets with tracklist/card-row display toggle |
| open | [pagetour-functionality-only-with-annotations.md](pagetour-functionality-only-with-annotations.md) | (Later) Page tour: inner pages show only page functionality (no menus); menus only on front-page tour; always annotate page purpose |
| open | [admin-artwork-presets-modal-redesign.md](admin-artwork-presets-modal-redesign.md) | (Later) Artwork presets: modal editor (compact), live grid update, top-right Add-new + guarded Reset-to-defaults |
| partial | [viewshell-page-headers.md](viewshell-page-headers.md) | Cover-overlay Studio entity headers excluded |

## Fold rule (copy into CLAUDE / chat)

```
Done task → append summary to docs/todo/HISTORY.md → delete docs/todo/<file>.md
         → remove row from INDEX.md → strip finished items from WORKPLAN.md
Never leave **Status:** done files in docs/todo/.
```
