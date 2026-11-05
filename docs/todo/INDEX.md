# docs/todo — open work index

Agents: read this file instead of listing or skimming all of `docs/todo/`.  
When a task is finished → fold into [`HISTORY.md`](HISTORY.md), delete the todo file, update this index, and remove finished checkboxes from `WORKPLAN.md` / other active trackers.

Status values: `open` | `blocked` | `partial`.

Shipped work belongs in HISTORY. Rows are grouped by what they wait on.

## Launch follow-up (SPA serves every host since 2026-10-21)

| Status  | File | One-line |
| ------- | ---- | -------- |
| partial | [beta-launch-findings.md](beta-launch-findings.md) | Test releases on the front page; open Studio/listener/platform findings from the beta e2e run and the legacy parity sweep |
| open    | [final-season-hardening.md](final-season-hardening.md) | Batch A/B and the deploy-bundle API-origin assert shipped; left: P2 hardening (CSRF/CORS, CSP enforce, upload magic, SR pass) |
| partial | [first-100-users-infra.md](first-100-users-infra.md) | Verified on vimage 2026-11-02: rate limits fail closed, disk fine; backup restore test + vimage6 push fixed in tahti-org#1042; left: leaked restore containers, MinIO mirror + DR alias |
| open    | [radio-nova-nrj-playback.md](radio-nova-nrj-playback.md) | Radio Nova + NRJ (Bauer AAC streams) do not play in production; reproduce in a real browser |
| blocked | [fan-live-chat-discoverable.md](fan-live-chat-discoverable.md) | Live verify Centrifugo Send on brand-new channel — playbook ready |

## Engineering backlog (no external blocker)

| Status  | File | One-line |
| ------- | ---- | -------- |
| open    | [ambient-track-list-mobile.md](ambient-track-list-mobile.md) | Phone: AmbientTrackList/Playable default to list; denser rows + larger art; densities misaligned on narrow |
| open    | [empty-state-create-ctas.md](empty-state-create-ctas.md) | PageEmpty createables: icon+title `action` on empties; full 2026-11-05 inventory (Priority A/B, Near vs Gap) |
| open    | [finish-wip-2026-11-04.md](finish-wip-2026-11-04.md) | Collect and finish or close the unfinished 2026-11-04 WIP branches and draft PRs |
| open    | [performance-audit-spa-2026-11-04.md](performance-audit-spa-2026-11-04.md) | SPA performance audit (bundle, route chunks, long lists, phone first paint); findings before code |
| partial | [library-management-port.md](library-management-port.md) | Port theDAW library management to Library Sounds: paged API client, facets/stats, bulk delete/edit |
| partial | [artwork-preset-covers.md](artwork-preset-covers.md) | Presets as default covers + cover picker shipped; merge tahti-org#1033 and run the backfill |
| partial | [listings-news-polish.md](listings-news-polish.md) | UI implemented; live opening-post update awaits admin authentication |
| partial | [navigation-simplification.md](navigation-simplification.md) | Studio six tabs with Fans/Profile hubs, Admin six sections with hubs, Library History/Following shipped; left: catalog move to Studio → Music, Profile forms in Studio, Broadcast agenda, Inbox chips, Overview merge, docs rewrite |
| partial | [finnish-localization.md](finnish-localization.md) | Settings → Language plus chrome/player/Listen/Discover/Library and batches 31–50 Settings/Studio/Admin/Radio/channel/empties; left: more web.actions sites, API notification bodies, Upload leftovers, SEO/pageTour/keyboard help |
| partial | [date-format-sweep.md](date-format-sweep.md) | One date style: helpers, `ListingDate`, listings + Kept notes through batch 43; left: chart/stats `toLocale*` stay chart-locale |
| open    | [ui-requests-2026-11-03.md](ui-requests-2026-11-03.md) | Open queue from the 2026-11-03 session: board track-edit product call, embed track API fix (tahti-org, unpushed), NRJ, server-side peaks, Recently played search, track page like-button check |
| partial | [listen-artist-channel-cleanup.md](listen-artist-channel-cleanup.md) | Shipped 0.0.296; left: embed downloads (product call) and keeping a stage-hosted embed across routes |
| open    | [simplify-studio-library-settings-admin.md](simplify-studio-library-settings-admin.md) | Plan: page anatomy rules (one header, one primary action, overflow, one toolbar), Settings account-only in 7 items, duplicate surfaces removed; 9 phases, absorbs navigation-simplification slices 1-3, 7, 9, 10 |
| partial | [artist-groups.md](artist-groups.md) | Groups Phases 0–4 + Discover Groups tab + five mock collectives; left: commit/deploy org, e2e |
| partial | [studio-fans-chat.md](studio-fans-chat.md) | Fans Chat on hub + Settings/Profile pointers; left: live verify after merge |
| open    | [ux-backlog.md](ux-backlog.md) | Open UI/UX polish: de-green `Button` (red `ConfirmDialog destructive` on events/updates/editor/playlist/collection/release, radio presets, theme submissions; plugin-store disconnect; left: none known) |
| open    | [e2e-coverage-gap.md](e2e-coverage-gap.md) | Features × roles e2e matrix on the mock app; left: collection player (placement), Go live → green room, Radio/Discover journeys after their rework, Player seek/fullscreen, open findings |
| open    | [navigation-flow-audit.md](navigation-flow-audit.md) | Back-link convention + checks; left: admin breadcrumbs skip the hub, release-track insights back target |
| open    | [view-first-and-test-hardening-leftovers.md](view-first-and-test-hardening-leftovers.md) | Release ops form-first, a gallery-wipe bug, stale-fetch guards, dead code needing a call, Storybook Tabs fade under load |
| partial | [auth-refresh-tokens.md](auth-refresh-tokens.md) | JWT access + refresh: org #880 + web + CLI `--device` shipped; desktop keychain plugin + cookie cutover remain |
| partial | [tahti-ops-cli.md](tahti-ops-cli.md) | Fold scripts/ into tahti-ops; shipped: env, smoke, backup status, deploy |
| partial | [listening-party.md](listening-party.md) | Digital-only v1 merged (tahti-org#1029, tahti-player#1704); real-API check after deploy, then playout, formats/pre-orders/physical |

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
| partial | [desktop-ui-slowness.md](desktop-ui-slowness.md) | GPU compositing back on by default; waiting on the user's scroll check |

## Fold rule (copy into CLAUDE / chat)

```
Done task → append summary to docs/todo/HISTORY.md → delete docs/todo/<file>.md
         → remove row from INDEX.md → strip finished items from WORKPLAN.md
Never leave **Status:** done files in docs/todo/.
```
