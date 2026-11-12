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

## Next 50 slices

Split out of [next-50.md](next-50.md). One file per slice. The parent file stays until that area is folded.

| Status  | File | One-line |
| ------- | ---- | -------- |
| open    | [admin-queue-list-jobs.md](admin-queue-list-jobs.md) | List the jobs that are processing, waiting, and failed |
| open    | [admin-queue-retry-job.md](admin-queue-retry-job.md) | Retry one failed queue job from Admin |
| open    | [admin-queue-remove-job.md](admin-queue-remove-job.md) | Remove one job from a queue |
| open    | [admin-queue-pause.md](admin-queue-pause.md) | Pause and resume a queue |
| open    | [admin-queue-requeue-pending.md](admin-queue-requeue-pending.md) | Re-queue sounds stuck PENDING with a stored file and no job |
| open    | [help-finnish-native-review.md](help-finnish-native-review.md) | Native review of the redesigned Help and For artists pages |
| open    | [help-drop-pricing-claims.md](help-drop-pricing-claims.md) | Remove pricing claims the Help redesign still shows |
| open    | [hearthis-release-product-defaults.md](hearthis-release-product-defaults.md) | Confirm the product defaults for tahti hearthis release |
| open    | [hearthis-release-live-run.md](hearthis-release-live-run.md) | One live tahti hearthis release run |
| open    | [hearthis-collection-live-run.md](hearthis-collection-live-run.md) | One live tahti hearthis collection run |
| open    | [channel-metrics-followers.md](channel-metrics-followers.md) | Show followers and following on the channel, each with a public toggle |
| open    | [channel-metrics-plays.md](channel-metrics-plays.md) | Show plays today, yesterday, and total, each with a public toggle |
| open    | [channel-metrics-downloads.md](channel-metrics-downloads.md) | Show downloads on the channel with a public toggle |
| open    | [channel-upcoming-events.md](channel-upcoming-events.md) | List upcoming events on the channel, including ones the artist plays at |
| open    | [channel-past-events.md](channel-past-events.md) | List past events on the channel |
| open    | [finish-wip-2026-11-04-branches.md](finish-wip-2026-11-04-branches.md) | Finish or close the unfinished 2026-11-04 branches and draft PRs |
| open    | [embed-covers-slices-17-20.md](embed-covers-slices-17-20.md) | Finish embed cover slices 17–20 |
| open    | [embed-covers-slices-24-30.md](embed-covers-slices-24-30.md) | Finish embed cover slices 24, 25, 29, and 30 |
| open    | [server-peaks-studio-collections.md](server-peaks-studio-collections.md) | Show server waveform peaks on studio collection track lists |
| open    | [server-peaks-radio-feed.md](server-peaks-radio-feed.md) | Show server waveform peaks on radio and the feed |
| open    | [yaniho-channel-pregenerate-peaks.md](yaniho-channel-pregenerate-peaks.md) | Pre-generate peaks so Yaniho channel tracks are not stuck loading |
| open    | [artwork-preset-backfill.md](artwork-preset-backfill.md) | Run the artwork-preset cover backfill after tahti-org#1033 is merged |
| open    | [listings-news-opening-post.md](listings-news-opening-post.md) | Update the listings news opening post once an admin is signed in |
| open    | [studio-music-catalog.md](studio-music-catalog.md) | Move the catalog into Studio → Music |
| open    | [studio-profile-forms.md](studio-profile-forms.md) | Edit profile forms from Studio |
| open    | [broadcast-agenda.md](broadcast-agenda.md) | Give Broadcast an agenda |
| open    | [studio-overview-merge.md](studio-overview-merge.md) | Merge the extra Studio overview into the simplified nav |
| open    | [finnish-api-notifications.md](finnish-api-notifications.md) | Translate API notification bodies |
| open    | [board-track-edit-product-call.md](board-track-edit-product-call.md) | Decide how board members edit a track |
| open    | [embed-track-api-fix.md](embed-track-api-fix.md) | Fix the embed track API in tahti-org |
| open    | [embed-downloads-product-call.md](embed-downloads-product-call.md) | Decide whether an embed offers downloads |
| open    | [artist-groups-org-e2e.md](artist-groups-org-e2e.md) | Ship the org side of artist groups and cover it with e2e |
| open    | [fans-chat-live-verify.md](fans-chat-live-verify.md) | Verify Fans Chat on the hub after merge |

## Engineering backlog (no external blocker)

| Status  | File | One-line |
| ------- | ---- | -------- |
| open    | [next-50.md](next-50.md) | Map of the 50 slice files in the Next 50 slices section |
| open    | [admin-queue-tools.md](admin-queue-tools.md) | Admin queue tools: see jobs processing now, waiting and failed; retry, remove, pause; re-queue stuck `PENDING` uploads |
| partial | [help-pages-finnish-redesign.md](help-pages-finnish-redesign.md) | Help + For artists redesign with Finnish; left: native review and which pricing claims to restore |
| partial | [hearthis-to-tahti-release-cli.md](hearthis-to-tahti-release-cli.md) | `tahti hearthis release` shipped (slices 1-8); confirm product defaults + one live run |
| partial | [hearthis-collections-cli.md](hearthis-collections-cli.md) | `tahti hearthis collection`, `collections create` and the shared upload ledger shipped; left: one live run |
| open    | [channel-page-metrics-about-events.md](channel-page-metrics-about-events.md) | Channel page metrics and events; About is the bio plus links under the name (0.0.378) |
| open    | [finish-wip-2026-11-04.md](finish-wip-2026-11-04.md) | Collect and finish or close the unfinished 2026-11-04 WIP branches and draft PRs |
| partial | [library-management-port.md](library-management-port.md) | Cloud Sounds library mgmt: player slices 11–30 shipped; org API rows remain |
| partial | [server-peaks-in-track-lists.md](server-peaks-in-track-lists.md) | Server waveform peaks on every track list (search, Selects, New to you, profile fallback); left: studio collections, radio/feed |
| open    | [yaniho-channel-waveform-peaks.md](yaniho-channel-waveform-peaks.md) | Yaniho channel (`/channel/yaniho`) tracks still show loading over the waveform; pre-generate peaks for every view during pre-processing |
| partial | [artwork-preset-covers.md](artwork-preset-covers.md) | Presets as default covers + cover picker shipped; merge tahti-org#1033 and run the backfill |
| partial | [listings-news-polish.md](listings-news-polish.md) | UI implemented; live opening-post update awaits admin authentication |
| partial | [navigation-simplification.md](navigation-simplification.md) | Studio six tabs with Fans/Profile hubs, Admin six sections with hubs, Library History/Following shipped; Inbox queue chips shipped (0.0.377); left: catalog move to Studio → Music, Profile forms in Studio, Broadcast agenda, Overview merge, docs rewrite |
| open    | [library-for-listeners.md](library-for-listeners.md) | Library is for listeners (saved items, desktop library browse); move Sounds, Collections, Upload, Recordings and Smart links to Studio and change the nav |
| partial | [finnish-localization.md](finnish-localization.md) | Settings → Language plus chrome/player/Listen/Discover/Library; web.actions, SEO, the page tour and the Upload broadcast label have Finnish; left: API notification bodies |
| open    | [ui-requests-2026-11-03.md](ui-requests-2026-11-03.md) | Open queue from the 2026-11-03 session: board track-edit product call, embed track API fix (tahti-org), NRJ, server-side peaks. Track page like and recently played search shipped. |
| partial | [listen-artist-channel-cleanup.md](listen-artist-channel-cleanup.md) | Shipped 0.0.296; stage embed stays one widget (0.0.376); left: embed downloads (product call) |
| open    | [simplify-studio-library-settings-admin.md](simplify-studio-library-settings-admin.md) | Plan: page anatomy rules (one header, one primary action, overflow, one toolbar), Settings account-only in 7 items, duplicate surfaces removed; 9 phases, absorbs navigation-simplification slices 1-3, 7, 9, 10 |
| partial | [artist-groups.md](artist-groups.md) | Groups Phases 0–4 + Discover Groups tab + five mock collectives; left: commit/deploy org, e2e |
| partial | [studio-fans-chat.md](studio-fans-chat.md) | Fans Chat on hub + Settings/Profile pointers; left: live verify after merge |
| partial | [admin-dashboard-snappy.md](admin-dashboard-snappy.md) | Admin dashboard now renders its last result at once and refreshes in the background; left: measure API time, sweep governance overview, financial, Discover |
| open    | [admin-overview-stats-and-grafana.md](admin-overview-stats-and-grafana.md) | Admin overview still slow to load; move the stats to the top of the page; Grafana from tahti.live says it cannot connect |
| partial | [channel-programme-in-schedule.md](channel-programme-in-schedule.md) | Studio → Broadcast → Schedule shows the 24/7 and offline programme; make it the place where you manage the channel's programme |
| open    | [google-facebook-login.md](google-facebook-login.md) | Sign up and log in with Google and Facebook: API OAuth callbacks, OAuth apps (ops), buttons on log in / sign up, account linking |
| partial | [navigation-performance.md](navigation-performance.md) | Back/forward speed: GET cache, atlas out of the shell and gzip level 6 done; left: render cached data without a loader frame, drop mock fixtures from prod, split table/dnd out of the shell |
| open    | [ux-backlog.md](ux-backlog.md) | Open UI/UX polish: de-green `Button` (red `ConfirmDialog destructive` on events/updates/editor/playlist/collection/release, radio presets, theme submissions; plugin-store disconnect; left: none known) |
| open    | [storybook-play-runner-disconnect.md](storybook-play-runner-disconnect.md) | One Storybook play session drops its sockets ~90s in (local every run, CI long shards); reduced motion + CI retry mitigate; cause not found |
| open    | [e2e-coverage-gap.md](e2e-coverage-gap.md) | Features × roles e2e matrix on the mock app; left: collection player (placement), Go live → green room, Radio/Discover journeys after their rework, Player seek/fullscreen, open findings |
| open    | [navigation-flow-audit.md](navigation-flow-audit.md) | Back-link convention + checks; left: cross-section trail on phones (design call) |
| open    | [view-first-and-test-hardening-leftovers.md](view-first-and-test-hardening-leftovers.md) | Release ops form-first, a gallery-wipe bug, stale-fetch guards, dead code needing a call, Storybook Tabs fade under load |
| partial | [auth-refresh-tokens.md](auth-refresh-tokens.md) | JWT access + refresh: org #880 + web + CLI `--device` shipped; desktop keychain plugin + cookie cutover remain |
| partial | [tahti-ops-cli.md](tahti-ops-cli.md) | Fold scripts/ into tahti-ops; shipped: env, smoke, backup status, deploy |
| partial | [listening-party.md](listening-party.md) | Digital-only v1 merged (tahti-org#1029, tahti-player#1704); real-API check after deploy, then playout, formats/pre-orders/physical |
| partial | [listening-parties-discover.md](listening-parties-discover.md) | Discover → Parties tab and widget shipped; left: reminders, non-artist hosting and Studio filter product calls |

## Blocked on a decision, credentials or manual testing

| Status  | File | One-line |
| ------- | ---- | -------- |
| blocked | [dead-end-leftovers.md](dead-end-leftovers.md) | OAuth app credentials (ops), Bandcamp API approval, Google Drive Picker, governance Retry |
| partial | [channel-layout-server-side.md](channel-layout-server-side.md) | Page layout saved on the channel (tahti-org #1075 + web); left: deploy the API first, and the per-browser player/backdrop look visibility |
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
| partial | [android-apk-release.md](android-apk-release.md) | Signed APK command and Android APK workflow shipped; left: repo secrets + first real run, then `ANDROID_RELEASES_ENABLED` |
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
