# docs/todo — open work index

Agents: read this file instead of listing or skimming all of `docs/todo/`.  
When a task is finished → fold into [`HISTORY.md`](HISTORY.md), delete the todo file, update this index, and remove finished checkboxes from `WORKPLAN.md` / other active trackers.

Status values: `open` | `blocked` | `partial`.

This index should only contain **blocked** items (human/product/ops dependency) or **partial** items actively mid-shipping. Shipped work belongs in HISTORY.

| Status  | File                                                                                                     | One-line                                                                                                                                                                                                                                                       |
| ------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| blocked | [final-season-hardening.md](final-season-hardening.md) | Cutover L ops (proxy, runbook, vend SPA); Batch A/B code merged |
| blocked | [first-100-users-infra.md](first-100-users-infra.md) | Ops verify backups/disk + deploy Swarm fail-closed (#872/#873/#1079 merged); host access required |
| blocked | [finnish-radio-now-playing-scrapers.md](finnish-radio-now-playing-scrapers.md) | Yle key + Nelonen scrapers; org User-Agent/kill-switch |
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
| partial | [listen-ui-liveliness.md](listen-ui-liveliness.md) | Nuclear-green accents + section pill hues shipped; left: de-green Card/Button/MediaArtwork, History/Collection depth |
| open    | [ux-sweep-30-slices.md](ux-sweep-30-slices.md) | 30 micro-slices across empties, catalog chips, SectionTitle, History/Collection depth, Card surface, Studio search |
| open    | [view-modes-track-tables.md](view-modes-track-tables.md) | No list/grid view-mode or sort anywhere; add to shared PlayableTrackTable + studio/library lists |
| open    | [studio-artist-usability.md](studio-artist-usability.md) | Per-release stats, bulk selection, search parity, release lifecycle, row quick actions, toast drift |
| open    | [profile-surfaces-unification.md](profile-surfaces-unification.md) | Artist/Channel profile pages + 3× collection rendering + Library trio are copy-pasted; extract shared surfaces |
| open    | [catalog-components-empty-states.md](catalog-components-empty-states.md) | Hand-rolled pills/tabs/badges + 10 raw tables + bare empty text → catalog Badge/FilterChips/Tabs/EmptyState |

## Fold rule (copy into CLAUDE / chat)

```
Done task → append summary to docs/todo/HISTORY.md → delete docs/todo/<file>.md
         → remove row from INDEX.md → strip finished items from WORKPLAN.md
Never leave **Status:** done files in docs/todo/.
```
