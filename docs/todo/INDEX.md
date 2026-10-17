# docs/todo — open work index

Agents: read this file instead of listing or skimming all of `docs/todo/`.  
When a task is finished → fold into [`HISTORY.md`](HISTORY.md), delete the todo file, update this index, and remove finished checkboxes from `WORKPLAN.md` / other active trackers.

Status values: `open` | `blocked` | `partial`.

This index should only contain **blocked** items (human/product/ops dependency) or **partial** items actively mid-shipping. Shipped work belongs in HISTORY.

| Status  | File                                                                                                     | One-line                                                                                                                                                                                                                                                       |
| ------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| blocked | [final-season-hardening.md](final-season-hardening.md) | Cutover L ops (proxy, runbook, vend SPA); Batch A/B code merged |
| blocked | [first-100-users-infra.md](first-100-users-infra.md) | Ops verify backups/disk + deploy Swarm fail-closed (#872/#873/#1079 merged); host access required |
| partial | [batch-71-ux-usability.md](batch-71-ux-usability.md) | Batch 71 UX: remaining slices 6–9, 11, 13, 17–20 still to ship then fold |
| blocked | [feature-swipe-product-flags.md](feature-swipe-product-flags.md) | Product call: Distribution StudioNav, /chat chrome, mobile More |
| blocked | [fan-live-chat-discoverable.md](fan-live-chat-discoverable.md) | Live-API verify Centrifugo Send on brand-new channels |
| blocked | [desktop-smart-playlists.md](desktop-smart-playlists.md) | Manual check on real 10k+ desktop library |
| blocked | [ai-dj-radio-dj-port.md](ai-dj-radio-dj-port.md) | POC not committed; no prod ship without go-ahead |
| blocked | [desktop-pro-library.md](desktop-pro-library.md) | Real-music validation + Phases 6–7 untouched |
| blocked | [import-provider-set-to-native-library.md](import-provider-set-to-native-library.md) | Manual desktop run vs real hearthis.at / SoundCloud |
| blocked | [admin-plugin-management-panel.md](admin-plugin-management-panel.md) | Multi-phase 13-category project not started |
| blocked | [release-player-workflow-broken.md](release-player-workflow-broken.md) | User store secrets + first real release run |
| blocked | [tahti-cli-tool.md](tahti-cli-tool.md) | npm publish @tahti/api-client (NPM_TOKEN) |
| blocked | [desktop-ui-slowness.md](desktop-ui-slowness.md) | Waiting user manual test of 30 fps fix |
| blocked | [listening-party.md](listening-party.md) | Needs user go-ahead for tahti-org work |
| blocked | [track-visualizer-video-editor.md](track-visualizer-video-editor.md) | PulseForge licence / port decision |
| blocked | [channel-page-redesign.md](channel-page-redesign.md) | Beta check + wider redesign product go-ahead |
| blocked | [ui-nav-audit.md](ui-nav-audit.md) | Channel visual redesign open (design/product) |

## Fold rule (copy into CLAUDE / chat)

```
Done task → append summary to docs/todo/HISTORY.md → delete docs/todo/<file>.md
         → remove row from INDEX.md → strip finished items from WORKPLAN.md
Never leave **Status:** done files in docs/todo/.
```
