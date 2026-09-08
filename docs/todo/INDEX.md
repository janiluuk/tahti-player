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
| partial | [governance-gap-list-top3.md](governance-gap-list-top3.md) | Admin governance consolidated + attendance mgmt (#6) + motion detail view (#1) shipped; public resolutions page (#3) remains |
| partial | [image-upload-hover-lightbox.md](image-upload-hover-lightbox.md) | Cover-image delete now on Collection/Playlist/Release (Release needed a new `../tahti-org` DELETE artwork route, committed not pushed); slideshow/backdrop + other surfaces remain |
| partial | [local-files-moved-to-library-tab.md](local-files-moved-to-library-tab.md) | Move done; desktop-mode gating open |
| partial | [listener-purchase-flow.md](listener-purchase-flow.md) | Subscription cancel shipped 2026-09-07; Purchases tab shipped 2026-09-08 (new `../tahti-org` `GET /api/me/purchases`); e2e still open |
| open | [plugin-registry-extraction.md](plugin-registry-extraction.md) | Pointer to sibling extraction checklist; PluginRegistryHost façade + §6 contract tests added 2026-09-08 |
| partial | [admin-plugin-management-panel.md](admin-plugin-management-panel.md) | Admin panel renamed disco widgets→Add-ons + PENDING review filter shipped 2026-09-08; default-enable, default settings, all-13-category scoping remain |
| partial | [release-player-workflow-broken.md](release-player-workflow-broken.md) | Root cause fixed 2026-09-07; user needs to run 2 `gh secret set` commands to finish |
| partial | [radio-browser-directory-fixes.md](radio-browser-directory-fixes.md) | Cover-image sub-ask needs decision |
| open | [tahti-cli-tool.md](tahti-cli-tool.md) | CLI (gumroad-cli-inspired) wrapping api-client — list library items, maybe TUI player |
| open | [tahti-org-ci-skip-full-e2e.md](tahti-org-ci-skip-full-e2e.md) | (tahti-org) CI always runs full e2e (vital-flows + user-journeys) on every push/PR; needs a skip/path-filter strategy |
| open | [tahti-theme-refactor.md](tahti-theme-refactor.md) | Orange-everywhere Button/Select defaults, contrast, visualizer visibility + settings gate |
| partial | [waveform-detail-accuracy.md](waveform-detail-accuracy.md) | TrackDetailView, StudioSoundView, TrackEditDialog now render real peaks at native resolution; fake-fallback noise + wiring real peaks into player bar/Discover/CollectionTrackList still unaddressed |
| partial | [listen-widget-hearthis-config-and-set-embed-bug.md](listen-widget-hearthis-config-and-set-embed-bug.md) | Auto-fill username + set-embed bug (real root cause: set pages 302-redirect, oembed.json only exists post-redirect) shipped; icon-button config UI needs user to point at specifics |
| open | [channel-designer-backdrop-fold-and-widgets.md](channel-designer-backdrop-fold-and-widgets.md) | (Later) Fold bio/CTA/avatar into backdrop show-toggles (not separate blocks); feed/posts as configurable widgets with tracklist/card-row display toggle |
| open | [admin-artwork-presets-modal-redesign.md](admin-artwork-presets-modal-redesign.md) | (Later) Artwork presets: modal editor (compact), live grid update, top-right Add-new + guarded Reset-to-defaults |

## Fold rule (copy into CLAUDE / chat)

```
Done task → append summary to docs/todo/HISTORY.md → delete docs/todo/<file>.md
         → remove row from INDEX.md → strip finished items from WORKPLAN.md
Never leave **Status:** done files in docs/todo/.
```
