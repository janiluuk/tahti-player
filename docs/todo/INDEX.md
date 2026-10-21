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
| partial | [finnish-radio-now-playing-scrapers.md](finnish-radio-now-playing-scrapers.md) | ICY-only for YleX/Rock/Suomipop; left: org UA + kill-switch |
| blocked | [fan-live-chat-discoverable.md](fan-live-chat-discoverable.md) | Live verify Centrifugo Send on brand-new channel — playbook ready |

## Engineering backlog (no external blocker)

| Status  | File | One-line |
| ------- | ---- | -------- |
| open    | [batch-88-wavesurfer-thirty.md](batch-88-wavesurfer-thirty.md) | Thirty slices: wavesurfer.js Waveform in ui, large preview migration, editor shell plugins |
| open    | [ux-backlog.md](ux-backlog.md) | All open UI/UX polish: small empty-state/catalog slices, liveliness, view modes + sort, shared profile/collection surfaces, Studio release lifecycle |
| open    | [navigation-flow-audit.md](navigation-flow-audit.md) | 180 routes, ~41 e2e-covered; back-link targets, dead links and nav inconsistencies |
| open    | [studio-usability-audit.md](studio-usability-audit.md) | Studio uses shared components; 3 actionable findings |
| open    | [studio-stats-audience-breakdown.md](studio-stats-audience-breakdown.md) | Rest of the stats page from the reference screenshot: stacked daily + CSV, loyalty, city list, browser/OS/device/source breakdown; needs tahti-org UA/referrer capture first |
| partial | [auth-refresh-tokens.md](auth-refresh-tokens.md) | JWT access + refresh: org #880 + web + CLI `--device` shipped; desktop keychain plugin + cookie cutover remain |
| partial | [tahti-ops-cli.md](tahti-ops-cli.md) | Fold scripts/ into tahti-ops; shipped: env, smoke, backup status, deploy |

## Blocked on a decision, credentials or manual testing

| Status  | File | One-line |
| ------- | ---- | -------- |
| blocked | [dead-end-leftovers.md](dead-end-leftovers.md) | OAuth app credentials (ops), Bandcamp API approval, Google Drive Picker, release delete (tahti-org route), governance Retry |
| blocked | [channel-page-redesign.md](channel-page-redesign.md) | Beta check + wider redesign product go-ahead |
| blocked | [ui-nav-audit.md](ui-nav-audit.md) | Channel visual redesign open (design/product) |
| blocked | [listening-party.md](listening-party.md) | Needs user go-ahead for tahti-org work |
| partial | [wavesurfer-waveforms.md](wavesurfer-waveforms.md) | wavesurfer.js: decisions locked; batch 88 ships ui Waveform + large previews + editor shell; desktop / full ProWaveform delete remain |
| blocked | [ai-dj-radio-dj-port.md](ai-dj-radio-dj-port.md) | POC not committed; no prod ship without go-ahead |
| blocked | [track-visualizer-video-editor.md](track-visualizer-video-editor.md) | PulseForge licence / port decision |
| blocked | [admin-plugin-management-panel.md](admin-plugin-management-panel.md) | Multi-phase 13-category project not started |
| blocked | [tahti-cli-tool.md](tahti-cli-tool.md) | npm publish @tahti/api-client (NPM_TOKEN) |
| blocked | [release-player-workflow-broken.md](release-player-workflow-broken.md) | User store secrets + first real release run |

## Desktop app

| Status  | File | One-line |
| ------- | ---- | -------- |
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
