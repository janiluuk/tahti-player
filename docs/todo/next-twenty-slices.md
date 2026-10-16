# Next twenty slices — batch 67 (UX / UI)

**Status:** open

Asked for after merging batch 66 (#948–#967, #949). Prefer mock-app-friendly tahti-web / `@tahti-player/ui` polish. One focused branch + PR per slice. Do not fold this file until the batch is done/merged.

Source: Storybook `Missing states:`, `MOCKS.md` thin spots, and leftover visual-check todos after batch 66.

## Slices

| # | Slice | Source todo / note | PR |
| - | ----- | ------------------ | -- |
| 1 | Hearthis embed: Storybook play on Library Tracks asserts compact iframe in the row action box (no full-width PlayerBar strip) | `hearthis-embed-in-play-container.md` | |
| 2 | Fold hearthis + library ambient todos after slice 1 (Storybook covers visual check) | `hearthis-embed-in-play-container.md`, `library-tracks-embed-layout-ambient.md` | |
| 3 | Fold batch 66 plan leftovers + `artist-lifecycle-p2-ux.md` (go-live chrome shipped #948); this plan file is batch 67 | docs fold | this PR |
| 4 | Fold `snapshot-digest-shows-history.md` (soft-pass unit + docs shipped #944/#966) | `snapshot-digest-shows-history.md` | (this PR) |
| 5 | Mock search: `buildMockSearch` returns collection hits from fixtures (today `collections: []`) | `MOCKS.md` | |
| 6 | GlobalSearch: Storybook play asserts Collections group when query matches a mock collection | Storybook / search | |
| 7 | DM `searchUsers` fixture expansion + Messages stories (multi-hit + empty) | `MOCKS.md` | |
| 8 | Richer mock studio archive seed (covers, visibility mix, second embed) | `MOCKS.md` | |
| 9 | StudioCollectionsView Storybook: populated, filtered-empty, quick-create at 390 px | Storybook gap | |
| 10 | Channel playlist: “no playable tracks” uses shared `EmptyState` (cards + table) | channel polish | |
| 11 | ChannelView offline @ 390 px Storybook (Off air stage + readable archive) | `channel-page-redesign.md` | |
| 12 | ThemeEditor: empty-name validation + discard draft (Missing states) | Storybook `Missing states:` | |
| 13 | ImageLightbox: empty gallery uses `EmptyState` instead of `null` | Storybook `Missing states:` | |
| 14 | WaveformSeekbar: live / no-duration story (+ Live badge UI if needed) | Storybook `Missing states:` | |
| 15 | Settings Integrations: API error banner story | Storybook `Missing states:` | |
| 16 | ChannelDesigner backdrop: long slideshow strip + upload-progress story | Storybook `Missing states:` | |
| 17 | ChannelDesigner player overlay: artwork-less preset tile story | Storybook `Missing states:` | |
| 18 | Press-kit GallerySection Storybook (mock upload/reorder); tick MOCKS.md | `MOCKS.md` | |
| 19 | MulticastConfigureDialog: save-failure story | Storybook `Missing states:` | |
| 20 | FeedView mobile Storybook: populated + signed-out empty at 390 px | Storybook gap | |

## Rules

- Rebase onto `origin/master` before every push.
- Bump `packages/tahti-web` (and/or `ui`) patch for user-visible changes.
- Storybook-first; no email-as-name; no invented API.
- Leave this plan open until the batch is folded after merges (or user asks to fold).
- Leave batch-67 PRs open for review (do not merge unless asked).

## Blockers / skips

- `fan-live-chat-discoverable.md` real Centrifugo Send — sibling/live API.
- `sweep-leftovers.md` deploy tahti-org#834 — sibling deploy.
- Full channel art-direction redesign — needs a reference.
- Listener Studio/Library product questions — need a decision.
- Desktop-only leftovers — out of scope for this batch.
