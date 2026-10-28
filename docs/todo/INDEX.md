# docs/todo — open work index

Agents: read this file instead of listing or skimming all of `docs/todo/`.  
When a task is finished → fold into [`HISTORY.md`](HISTORY.md), delete the todo file, update this index, and remove finished checkboxes from `WORKPLAN.md` / other active trackers.

Status values: `open` | `blocked` | `partial`.

Shipped work belongs in HISTORY. Rows are grouped by what they wait on.

## Launch: beta.tahti.live → main site

| Status  | File | One-line |
| ------- | ---- | -------- |
| partial | [beta-launch-findings.md](beta-launch-findings.md) | Domain switch, Tahti Radio HLS 404, #879 to prod, test releases on the front page; open Studio/listener/platform findings from the beta e2e run and the legacy parity sweep |
| blocked | [final-season-hardening.md](final-season-hardening.md) | Cutover L ops (vend SPA, prod upstream, runbook); DNS map filled — you flip |
| blocked | [first-100-users-infra.md](first-100-users-infra.md) | Ops verify backups/disk + deploy Swarm fail-closed (#872/#873/#1079 merged); host access required |
| open    | [radio-nova-nrj-playback.md](radio-nova-nrj-playback.md) | Radio Nova + NRJ (Bauer AAC streams) do not play in production; reproduce in a real browser |
| blocked | [fan-live-chat-discoverable.md](fan-live-chat-discoverable.md) | Live verify Centrifugo Send on brand-new channel — playbook ready |

## Engineering backlog (no external blocker)

| Status  | File | One-line |
| ------- | ---- | -------- |
| open    | [channel-store-editor.md](channel-store-editor.md) | Studio editor that puts tracks in the channel page Store section |
| open    | [ux-batch-115-thirty-slices.md](ux-batch-115-thirty-slices.md) | Paragraph empties, confirm-before-delete, and undo on create |
| open    | [ux-batch-114-thirty-slices.md](ux-batch-114-thirty-slices.md) | Thirty more list empties now use PageEmpty |
| open    | [ux-batch-113-thirty-slices.md](ux-batch-113-thirty-slices.md) | Thirty list empties now use PageEmpty |
| open    | [ux-batch-112-forty-slices.md](ux-batch-112-forty-slices.md) | Forty polish slices: ambient lists, undo toasts, de-green, PageEmpty, search keyboard, usability leftovers |
| open    | [ux-backlog.md](ux-backlog.md) | All open UI/UX polish: small empty-state/catalog slices, liveliness, view modes + sort, shared profile/collection surfaces, Studio release lifecycle |
| blocked | [discussion-topics.md](discussion-topics.md) | Board-created discussion topics shipped (API, web, CLI); only dropping the allowlisted routes remains, after the next tahti-org release |
| open    | [navigation-flow-audit.md](navigation-flow-audit.md) | 180 routes, ~41 e2e-covered; back-link targets, dead links and nav inconsistencies |
| partial | [auth-refresh-tokens.md](auth-refresh-tokens.md) | JWT access + refresh: org #880 + web + CLI `--device` shipped; desktop keychain plugin + cookie cutover remain |
| partial | [tahti-ops-cli.md](tahti-ops-cli.md) | Fold scripts/ into tahti-ops; shipped: env, smoke, backup status, deploy |
| partial | [listening-party.md](listening-party.md) | Digital-only v1: `/party/:id`, Studio schedule/manage and channel banner built on mocks; needs tahti-org#1029 merged + deployed and a real-API check; playout, formats/pre-orders/physical remain |

## Blocked on a decision, credentials or manual testing

| Status  | File | One-line |
| ------- | ---- | -------- |
| blocked | [dead-end-leftovers.md](dead-end-leftovers.md) | OAuth app credentials (ops), Bandcamp API approval, Google Drive Picker, governance Retry |
| blocked | [channel-page-redesign.md](channel-page-redesign.md) | Beta check + wider redesign product go-ahead |
| blocked | [ui-nav-audit.md](ui-nav-audit.md) | Channel visual redesign open (design/product) |
| partial | [wavesurfer-waveforms.md](wavesurfer-waveforms.md) | wavesurfer.js shipped (batch 88) and fixed (batch 89: silence bars, player `src`, theme); desktop / full ProWaveform delete remain |
| blocked | [ai-dj-radio-dj-port.md](ai-dj-radio-dj-port.md) | POC not committed; no prod ship without go-ahead |
| blocked | [track-visualizer-video-editor.md](track-visualizer-video-editor.md) | PulseForge licence / port decision |
| blocked | [admin-plugin-management-panel.md](admin-plugin-management-panel.md) | Multi-phase 13-category project not started |
| blocked | [tahti-cli-tool.md](tahti-cli-tool.md) | npm publish @tahti/api-client (NPM_TOKEN) |
| blocked | [release-player-workflow-broken.md](release-player-workflow-broken.md) | User store secrets + first real release run |

## Desktop app

| Status  | File | One-line |
| ------- | ---- | -------- |
| partial | [dj-catalog-hardening.md](dj-catalog-hardening.md) | Camelot/Open Key, mixable tracks, tap tempo, Prepare playlist; cues and DJ-software import still need Rust |
| blocked | [desktop-pro-library.md](desktop-pro-library.md) | Real-music validation + Phases 6–7 untouched |
| blocked | [desktop-smart-playlists.md](desktop-smart-playlists.md) | Manual check on real 10k+ desktop library |
| blocked | [import-provider-set-to-native-library.md](import-provider-set-to-native-library.md) | Manual desktop run vs real hearthis.at / SoundCloud |
| blocked | [desktop-ui-slowness.md](desktop-ui-slowness.md) | Waiting user manual test of 30 fps fix |

## Fold rule (copy into CLAUDE / chat)

```
Done task → append summary to docs/todo/HISTORY.md → delete docs/todo/<file>.md
         → remove row from INDEX.md → strip finished items from WORKPLAN.md
Never leave **Status:** done files in docs/todo/.
```
