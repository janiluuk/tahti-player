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
| open | [plugin-registry-extraction.md](plugin-registry-extraction.md) | Pointer to sibling extraction checklist |
| partial | [release-player-workflow-broken.md](release-player-workflow-broken.md) | Root cause fixed 2026-09-07; user needs to run 2 `gh secret set` commands to finish |
| partial | [radio-browser-directory-fixes.md](radio-browser-directory-fixes.md) | Cover-image sub-ask needs decision |
| partial | [stream-overlay-auto-fill-and-avatar-placeholder.md](stream-overlay-auto-fill-and-avatar-placeholder.md) | Now-playing artwork remaining |
| partial | [studio-emptystate-remaining.md](studio-emptystate-remaining.md) | Inline form hints + Settings-scope empties remain |
| open | [tahti-cli-tool.md](tahti-cli-tool.md) | CLI (gumroad-cli-inspired) wrapping api-client — list library items, maybe TUI player |
| open | [tahti-theme-refactor.md](tahti-theme-refactor.md) | Orange-everywhere Button/Select defaults, contrast, visualizer visibility + settings gate |
| open | [waveform-detail-accuracy.md](waveform-detail-accuracy.md) | Full track view waveform needs real detail/accuracy — WaveformSeekbar downsamples to 64 bars, fabricates fake bars when no peaks |
| open | [archive-mentions-source-url.md](archive-mentions-source-url.md) | Mentions API never selects/resolves `Mention.sourceId` into a real link — every mention falls back to the artist page; fully scoped per-surface, needs a dedicated tahti-org worktree |
| open | [studio-nav-perform-to-broadcast.md](studio-nav-perform-to-broadcast.md) | Move Perform into Studio→Broadcast; sweep all Studio pages for missing/wrong nav-tab active state at both levels |
| open | [onboarding-toast-noise.md](onboarding-toast-noise.md) | (Later) "Finish your profile" toast: exempt seeded users, once-per-session even without explicit dismiss, mark done before screenshots |
| open | [sticky-theme-review-toast.md](sticky-theme-review-toast.md) | (Later) "Theme is in review" mock toast reappears every reload — mock dismiss is a no-op; same root cause as onboarding-toast-noise |
| open | [channel-designer-backdrop-fold-and-widgets.md](channel-designer-backdrop-fold-and-widgets.md) | (Later) Fold bio/CTA/avatar into backdrop show-toggles (not separate blocks); feed/posts as configurable widgets with tracklist/card-row display toggle |
| partial | [viewshell-page-headers.md](viewshell-page-headers.md) | Cover-overlay Studio entity headers excluded |

## Fold rule (copy into CLAUDE / chat)

```
Done task → append summary to docs/todo/HISTORY.md → delete docs/todo/<file>.md
         → remove row from INDEX.md → strip finished items from WORKPLAN.md
Never leave **Status:** done files in docs/todo/.
```
