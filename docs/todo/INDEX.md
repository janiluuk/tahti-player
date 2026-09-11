# docs/todo — open work index

Agents: read this file instead of listing or skimming all of `docs/todo/`.  
When a task is finished → fold into [`HISTORY.md`](HISTORY.md), delete the todo file, update this index, and remove finished checkboxes from `WORKPLAN.md` / other active trackers.

Status values: `open` | `blocked` | `partial`.

| Status | File | One-line |
| --- | --- | --- |
| open | [player-performance-optimizations.md](player-performance-optimizations.md) | (Later) Release-build CPU/native-memory profiling, then startup, queue, playback, visualizer and loading optimizations |
| partial | [channel-designer-background-section-fixes.md](channel-designer-background-section-fixes.md) | Designer background section; design decision remains |
| blocked | [channelview-move-player-to-stage.md](channelview-move-player-to-stage.md) | Player-in-backdrop extraction needs a design decision |
| partial | [desktop-pro-library.md](desktop-pro-library.md) | Native capability signal shipped; durable import/play, catalog phases, and Soulseek remain |
| partial | [atlas-navigation-structure-widget.md](atlas-navigation-structure-widget.md) | Atlas navigation draft widget supports persisted reorder/add/remove; runtime wiring intentionally deferred |
| partial | [go-live-header-subtext-cleanup.md](go-live-header-subtext-cleanup.md) | Calendar view restore still open |
| partial | [channel-designer-rail-and-broadcast-nav.md](channel-designer-rail-and-broadcast-nav.md) | Designer→right rail, tahti-dark, Broadcast menu, Studio nav origin/slots |
| open | [governance-gap-list.md](governance-gap-list.md) | Governance gaps: 16 of 18 shipped; remaining bulk comments (#2), voting window (#15, backend-blocked) |
| partial | [image-upload-hover-lightbox.md](image-upload-hover-lightbox.md) | Press-kit lightbox delete shipped 2026-09-10; admin radio logo blocked on redesign |
| open | [plugin-registry-extraction.md](plugin-registry-extraction.md) | Pointer to sibling extraction checklist; PluginRegistryHost façade + §6 contract tests added 2026-09-08 |
| partial | [admin-plugin-management-panel.md](admin-plugin-management-panel.md) | Discovery/Add-ons category done 2026-09-08; all-13-category scoping still open |
| partial | [release-player-workflow-broken.md](release-player-workflow-broken.md) | Root cause fixed 2026-09-07; user needs to run 2 `gh secret set` commands to finish |
| partial | [radio-browser-directory-fixes.md](radio-browser-directory-fixes.md) | Cover-image sub-ask needs decision |
| open | [tahti-cli-tool.md](tahti-cli-tool.md) | CLI (gumroad-cli-inspired) wrapping api-client — list library items, maybe TUI player |
| open | [tahti-org-ci-skip-full-e2e.md](tahti-org-ci-skip-full-e2e.md) | (tahti-org) CI always runs full e2e on every push/PR; needs a skip/path-filter strategy |
| partial | [listen-widget-hearthis-config-and-set-embed-bug.md](listen-widget-hearthis-config-and-set-embed-bug.md) | Auto-fill username + set-embed bug shipped; icon-button config UI needs user to point at specifics |
| partial | [codebase-refactor-hotspots.md](codebase-refactor-hotspots.md) | http + PluginStore Radio/Service/Themes + admin radio/storage/addons peeled; SettingsPanels / client domains / remaining admin still open |
| partial | [performance-cleanup-bulk.md](performance-cleanup-bulk.md) | Phases 1–3 + 5 done; Phase 4: PluginStore + admin radio/storage/addons peeled; SettingsPanels / client / studio / router still open |
| open | [channel-designer-backdrop-fold-and-widgets.md](channel-designer-backdrop-fold-and-widgets.md) | (Later) Fold bio/CTA/avatar into backdrop show-toggles; feed/posts widgets |

## Fold rule (copy into CLAUDE / chat)

```
Done task → append summary to docs/todo/HISTORY.md → delete docs/todo/<file>.md
         → remove row from INDEX.md → strip finished items from WORKPLAN.md
Never leave **Status:** done files in docs/todo/.
```
