# docs/todo — open work index

Agents: read this file instead of listing or skimming all of `docs/todo/`.  
When a task is finished → fold into [`HISTORY.md`](HISTORY.md), delete the todo file, update this index, and remove finished checkboxes from `WORKPLAN.md` / other active trackers.

Status values: `open` | `blocked` | `partial`.

Shipped work belongs in HISTORY. Rows are grouped by what they wait on.

## Launch follow-up (SPA serves every host since 2026-10-21)

| Status  | File | One-line |
| ------- | ---- | -------- |
| partial | [beta-launch-findings.md](beta-launch-findings.md) | Channel blocks packing regression covered; left: beta content cleanup + live beta checks |
| open    | [final-season-hardening.md](final-season-hardening.md) | Batch A/B + CSP embed/sandbox + SR code-audit (next-30 pressed/Connecting/Jam/i18n); left: CSRF/CORS and API-edge CSP (tahti-org), real screen-reader run |
| partial | [first-100-users-infra.md](first-100-users-infra.md) | Verified on vimage 2026-11-02: rate limits fail closed, disk fine; backup restore test + vimage6 push fixed in tahti-org#1042; left: leaked restore containers, MinIO mirror + DR alias |
| open    | [radio-nova-nrj-playback.md](radio-nova-nrj-playback.md) | Radio Nova + NRJ (Bauer AAC streams) do not play in production; reproduce in a real browser |
| blocked | [fan-live-chat-discoverable.md](fan-live-chat-discoverable.md) | Live verify Centrifugo Send on brand-new channel — playbook ready |

## Next 50 slices

Split out of [next-50.md](next-50.md). One file per slice. The parent file stays until that area is folded.

| Status  | File | One-line |
| ------- | ---- | -------- |
| open    | [help-finnish-native-review.md](help-finnish-native-review.md) | Native review of the redesigned Help and For artists pages |
| open    | [hearthis-release-product-defaults.md](hearthis-release-product-defaults.md) | Confirm the product defaults for tahti hearthis release |
| open    | [hearthis-release-live-run.md](hearthis-release-live-run.md) | One live tahti hearthis release run |
| open    | [hearthis-collection-live-run.md](hearthis-collection-live-run.md) | One live tahti hearthis collection run |
| open    | [artwork-preset-backfill.md](artwork-preset-backfill.md) | Run the artwork-preset cover backfill after tahti-org#1033 is merged |
| open    | [listings-news-opening-post.md](listings-news-opening-post.md) | Update the listings news opening post once an admin is signed in |
| partial | [finnish-api-notifications.md](finnish-api-notifications.md) | Language panel persists uiLocale; left: remaining API notification templates (org) |
| open    | [board-track-edit-product-call.md](board-track-edit-product-call.md) | Decide how board members edit a track |
| open    | [embed-downloads-product-call.md](embed-downloads-product-call.md) | Decide whether an embed offers downloads |
| open    | [artist-groups-org-e2e.md](artist-groups-org-e2e.md) | Ship the org side of artist groups and cover it with e2e |
| open    | [fans-chat-live-verify.md](fans-chat-live-verify.md) | Verify Fans Chat on the hub after merge |

## Engineering backlog (no external blocker)

| Status  | File | One-line |
| ------- | ---- | -------- |
| partial | [discover-events-tab.md](discover-events-tab.md) | Events tab, posting for any signed-in user, banner crop, event page backdrop built; left: e2e run, EventPostView story, filters (need org upcoming filters) |
| partial | [mobile-bottom-nav-readability.md](mobile-bottom-nav-readability.md) | Taller bar that grows by the gesture-bar inset, bigger labels/icons; left: check on a real Android phone |
| open    | [pattern-detection-grants-ui.md](pattern-detection-grants-ui.md) | Board grant preview anomaly chips + PATTERN_FRAUD_ALERT activity; left: pitch copy after org merge |
| open    | [next-50.md](next-50.md) | Map of the 50 slice files in the Next 50 slices section |
| partial | [help-pages-finnish-redesign.md](help-pages-finnish-redesign.md) | Help + For artists redesign with Finnish; left: native review |
| partial | [hearthis-to-tahti-release-cli.md](hearthis-to-tahti-release-cli.md) | `tahti hearthis release` shipped (slices 1-8); confirm product defaults + one live run |
| partial | [hearthis-collections-cli.md](hearthis-collections-cli.md) | `tahti hearthis collection`, `collections create` and the shared upload ledger shipped; left: one live run |
| partial | [artwork-preset-covers.md](artwork-preset-covers.md) | Presets as default covers + cover picker shipped; merge tahti-org#1033 and run the backfill |
| partial | [listings-news-polish.md](listings-news-polish.md) | UI implemented; live opening-post update awaits admin authentication |
| partial | [navigation-simplification.md](navigation-simplification.md) | Library Playlists + Go live takeover shipped (next-30); left: Go live stepper polish |
| partial | [finnish-localization.md](finnish-localization.md) | UI Finnish largely shipped; left: API notification bodies (blocked — see finnish-api-notifications.md) |
| open    | [ui-requests-2026-11-03.md](ui-requests-2026-11-03.md) | Open queue from the 2026-11-03 session: board track-edit product call, embed track API fix (tahti-org), NRJ, server-side peaks. Track page like and recently played search shipped. |
| partial | [listen-artist-channel-cleanup.md](listen-artist-channel-cleanup.md) | Shipped 0.0.296; stage embed stays one widget (0.0.376); left: embed downloads (product call) |
| partial | [simplify-studio-library-settings-admin.md](simplify-studio-library-settings-admin.md) | Library Playlists + Go live takeover (next-30); left: phase 3 Go live stepper polish |
| partial | [artist-groups.md](artist-groups.md) | Groups Phases 0–4 + Discover Groups tab + five mock collectives; left: commit/deploy org, e2e |
| partial | [studio-fans-chat.md](studio-fans-chat.md) | Fans Chat on hub + Settings/Profile pointers; left: live verify after merge |
| partial | [admin-dashboard-snappy.md](admin-dashboard-snappy.md) | Admin dashboard now renders its last result at once and refreshes in the background; left: measure API time and cache slow calls server-side |
| open    | [admin-overview-stats-and-grafana.md](admin-overview-stats-and-grafana.md) | Community stats at the top (0.0.380) with their own snapshot, loading next to the dashboard (0.0.401); left: measure and cache the slow API calls (tahti-org), and Grafana from tahti.live cannot connect |
| open    | [google-facebook-login.md](google-facebook-login.md) | Sign up and log in with Google and Facebook: API OAuth callbacks, OAuth apps (ops), buttons on log in / sign up, account linking |
| partial | [navigation-performance.md](navigation-performance.md) | Snapshots/GET cache/shell cuts done; remount assert in `useSnapshotFetch.test`; left: real-browser check vs live API |
| open    | [storybook-play-runner-disconnect.md](storybook-play-runner-disconnect.md) | Many-file Chromium drop; CI ~50-file shards; 406 tahti-web stories; no single-file culprit yet |
| open    | [e2e-coverage-gap.md](e2e-coverage-gap.md) | Matrix + Library Playlists viewport e2e; left: collection player placement, open findings |
| open    | [navigation-flow-audit.md](navigation-flow-audit.md) | Back-link convention + checks; left: cross-section trail on phones (design call) |
| open    | [view-first-and-test-hardening-leftovers.md](view-first-and-test-hardening-leftovers.md) | Next-30 pruned unused store getters / Storybook-only notes / Revelator isolation; leftovers needing a call remain |
| partial | [auth-refresh-tokens.md](auth-refresh-tokens.md) | JWT access + refresh: org #880 + web + CLI `--device` shipped; desktop keychain plugin + cookie cutover remain |
| partial | [tahti-ops-cli.md](tahti-ops-cli.md) | Fold scripts/; storybook surfaces + close-external-issue wrapped; desktop shims deprecated toward `tahti-ops desktop` |
| partial | [listening-party.md](listening-party.md) | Digital-only v1 merged (tahti-org#1029, tahti-player#1704); real-API check after deploy, then playout, formats/pre-orders/physical |
| partial | [listening-parties-discover.md](listening-parties-discover.md) | Discover → Parties tab, widget and row reminders shipped; left: non-artist hosting and Studio filter product calls |

## Blocked on a decision, credentials or manual testing

| Status  | File | One-line |
| ------- | ---- | -------- |
| blocked | [dead-end-leftovers.md](dead-end-leftovers.md) | OAuth app credentials (ops), Bandcamp API approval, Google Drive Picker, governance Retry |
| partial | [channel-layout-server-side.md](channel-layout-server-side.md) | Page layout saved on the channel (tahti-org #1075 + web); left: deploy the API first, and the per-browser player/backdrop look visibility |
| blocked | [channel-page-redesign.md](channel-page-redesign.md) | Beta check + wider redesign product go-ahead |
| blocked | [ui-nav-audit.md](ui-nav-audit.md) | Channel visual redesign open (design/product) |
| partial | [wavesurfer-waveforms.md](wavesurfer-waveforms.md) | EditorWaveSurfer trim/zoom/region parity tests; ProWaveform delete still deferred; ui Waveform desktop preview story |
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
| partial | [desktop-ui-slowness.md](desktop-ui-slowness.md) | Ambient backdrop cheap path + softer PlayerBar blur (2026-11-19); waiting on the user's scroll check |

## Fold rule (copy into CLAUDE / chat)

```
Done task → append summary to docs/todo/HISTORY.md → delete docs/todo/<file>.md
         → remove row from INDEX.md → strip finished items from WORKPLAN.md
Never leave **Status:** done files in docs/todo/.
```
