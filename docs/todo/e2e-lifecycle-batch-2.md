# Artist lifecycle e2e — batch 2 (20 slices)

**Status:** partial  
**Follows:** [e2e-lifecycle-20-slices.md](e2e-lifecycle-20-slices.md) (#905–#916)  
**Source:** `packages/tahti-web/docs/e2e-journeys/artist-lifecycle/ISSUES.md`

Each slice is one branch, one commit, one PR against `master`. Mock APIs follow the #905 pattern (`mock-live-session`, persisted mock state). Left once all PRs merge: delete this file, fold into `HISTORY.md`, drop the INDEX row.

| #   | Slice                                                           | Branch                                | PR                                                            |
| --- | --------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------- |
| 1   | Align upload dialog formats with the upload page                | `feat/align-upload-copy`              | [#919](https://github.com/janiluuk/tahti-player/pull/919)     |
| 2   | Open the new sound after a modal upload                         | `feat/upload-dialog-navigate-success` | [#920](https://github.com/janiluuk/tahti-player/pull/920)     |
| 3   | `StudioUploadView` test: navigates to the uploaded sound        | `feat/studio-upload-view-test`        | [#921](https://github.com/janiluuk/tahti-player/pull/921)     |
| 4   | Link the upload modal to the full upload page                   | `feat/upload-dialog-full-page-link`   | [#922](https://github.com/janiluuk/tahti-player/pull/922)     |
| 5   | Explain quick upload vs the full upload page                    | `feat/add-to-music-upload-hint`       | [#924](https://github.com/janiluuk/tahti-player/pull/924)     |
| 6   | Remove dead upload modal from `AppTopNav`                       | `feat/remove-dead-topnav-upload-modal` | [#925](https://github.com/janiluuk/tahti-player/pull/925)     |
| 7   | `StudioCollectionsView` test: opens the editor for a new collection | `feat/collections-create-nav-test` | [#927](https://github.com/janiluuk/tahti-player/pull/927)     |
| 8   | Mock `createStudioCollection` slug resolves via `fetchStudioCollection` | `feat/mock-collection-create-slug` | [#928](https://github.com/janiluuk/tahti-player/pull/928)     |
| 9   | `/studio/channel` replaces the URL with `?tab=setup` when no tab is given | `feat/channel-tab-url-default` | [#932](https://github.com/janiluuk/tahti-player/pull/932)     |
| 10  | `StudioChannelView` section tab clicks write `?tab=` to the URL | `feat/channel-tab-url-sections`       | [#933](https://github.com/janiluuk/tahti-player/pull/933)     |
| 11  | Persist every inner radio tab in the `/studio/channel` URL      | `feat/channel-radio-inner-tab-url`    | [#935](https://github.com/janiluuk/tahti-player/pull/935)     |
| 12  | `StudioNav` Broadcast submenu vs Go live subnav labels          | `feat/broadcast-nav-label-tests`      | [#936](https://github.com/janiluuk/tahti-player/pull/936)     |
| 13  | Go live stays lit in the Broadcast subnav on `?tab=green-room`  | `feat/broadcast-subnav-active-green-room` | [#938](https://github.com/janiluuk/tahti-player/pull/938) |
| 14  | Mock `patchBroadcastPreflight({ seriesId })` sets `plannedLiveShow` and episode | `feat/mock-preflight-series-episode` | [#923](https://github.com/janiluuk/tahti-player/pull/923) |
| 15  | Mock `postGoLive` with a planned series creates the episode (stacked on #923) | `feat/go-live-create-episode-mock` | [#926](https://github.com/janiluuk/tahti-player/pull/926) |
| 16  | `BroadcastPreflightPanel` test: Series episode to `plannedLiveShow` | `feat/broadcast-preflight-series-ui-test` | [#930](https://github.com/janiluuk/tahti-player/pull/930) |
| 17  | `StudioGoLiveView` test: planned series episode and go live     | `feat/go-live-series-smoke-test`      | [#931](https://github.com/janiluuk/tahti-player/pull/931)     |
| 18  | `requestFanChatToken` mock token and local echo in `FanChatRoom` | `feat/fan-chat-force-mock`           | [#934](https://github.com/janiluuk/tahti-player/pull/934)     |
| 19  | `ChannelChatPanel` test: mock join then Send appends a message  | `feat/channel-chat-mock-send-journey` | [#937](https://github.com/janiluuk/tahti-player/pull/937)     |
| 20  | `ChannelView` test: live chat CTA when the channel is LIVE      | `feat/channel-live-chat-surfaces-test` | [#939](https://github.com/janiluuk/tahti-player/pull/939)    |

Also open from the same session, not counted above: [#918](https://github.com/janiluuk/tahti-player/pull/918) (queue icon while holding Shift on Play), [#929](https://github.com/janiluuk/tahti-player/pull/929) (CI snapshot refresh after Shift+click).
