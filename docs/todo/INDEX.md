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
| open | [governance-gap-list.md](governance-gap-list.md) | Governance gaps vs tahti-org: 14 of 18 shipped/corrected (see HISTORY + doc); remaining: bulk comments (#2, needs a product call), minutes upload (#10, needs new tahti-org backend), cursor pagination (#18, low-priority perf), voting window (#15, backend-blocked) |
| partial | [image-upload-hover-lightbox.md](image-upload-hover-lightbox.md) | Cover-image delete now on Collection/Playlist/Release (Release needed a new `../tahti-org` DELETE artwork route, committed not pushed); slideshow/backdrop + other surfaces remain |
| partial | [local-files-moved-to-library-tab.md](local-files-moved-to-library-tab.md) | Move done; desktop-mode gating open |
| partial | [listener-purchase-flow.md](listener-purchase-flow.md) | Subscription cancel shipped 2026-09-07; Purchases tab shipped 2026-09-08 (new `../tahti-org` `GET /api/me/purchases`); e2e still open |
| open | [plugin-registry-extraction.md](plugin-registry-extraction.md) | Pointer to sibling extraction checklist; PluginRegistryHost façade + §6 contract tests added 2026-09-08 |
| partial | [admin-plugin-management-panel.md](admin-plugin-management-panel.md) | Admin panel renamed disco widgets→Add-ons + PENDING review filter shipped 2026-09-08; default-enable, default settings, all-13-category scoping remain |
| partial | [release-player-workflow-broken.md](release-player-workflow-broken.md) | Root cause fixed 2026-09-07; user needs to run 2 `gh secret set` commands to finish |
| partial | [radio-browser-directory-fixes.md](radio-browser-directory-fixes.md) | Cover-image sub-ask needs decision |
| open | [tahti-cli-tool.md](tahti-cli-tool.md) | CLI (gumroad-cli-inspired) wrapping api-client — list library items, maybe TUI player |
| open | [tahti-org-ci-skip-full-e2e.md](tahti-org-ci-skip-full-e2e.md) | (tahti-org) CI always runs full e2e (vital-flows + user-journeys) on every push/PR; needs a skip/path-filter strategy |
| partial | [tahti-theme-refactor.md](tahti-theme-refactor.md) | Select's bg-primary default already fixed (doc was stale); theme identification, Button variant audit, contrast, visualizer visibility all still need live verification |
| partial | [waveform-detail-accuracy.md](waveform-detail-accuracy.md) | TrackDetailView, StudioSoundView, TrackEditDialog now render real peaks at native resolution; fake-fallback noise + wiring real peaks into player bar/Discover/CollectionTrackList still unaddressed |
| partial | [listen-widget-hearthis-config-and-set-embed-bug.md](listen-widget-hearthis-config-and-set-embed-bug.md) | Auto-fill username + set-embed bug (real root cause: set pages 302-redirect, oembed.json only exists post-redirect) shipped; icon-button config UI needs user to point at specifics |
| open | [channel-designer-backdrop-fold-and-widgets.md](channel-designer-backdrop-fold-and-widgets.md) | (Later) Fold bio/CTA/avatar into backdrop show-toggles (not separate blocks); feed/posts as configurable widgets with tracklist/card-row display toggle |

## Fold rule (copy into CLAUDE / chat)

```
Done task → append summary to docs/todo/HISTORY.md → delete docs/todo/<file>.md
         → remove row from INDEX.md → strip finished items from WORKPLAN.md
Never leave **Status:** done files in docs/todo/.
```
