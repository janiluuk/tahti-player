# Next twenty slices — batch 66 (UX / UI)

**Status:** partial

Asked for as the next twenty open-todo slices after batch 65 (#881–#900 area) and artist-lifecycle e2e (#905–#940). Prefer mock-app-friendly tahti-web / `@tahti-player/ui` polish. One focused branch + PR per slice. Do not fold this file until the batch is done/merged.

Source: [`docs/todo/INDEX.md`](INDEX.md) leftovers that are shippable without inventing API, plus Storybook `Missing states:` / mock thin spots called out in `MOCKS.md`.

## Slices

| # | Slice | Source todo / note | PR |
| - | ----- | ------------------ | -- |
| 1 | Flatten go-live chrome: on `/studio/go-live`, lift Prep tabs into the nested nav slot; Schedule/Events/Shows/Channel/Radio as siblings (drop the third tab row) | `artist-lifecycle-p2-ux.md` | [#948](https://github.com/janiluuk/tahti-player/pull/948) |
| 2 | Listener Library Stash: show stash **files** without `StudioGate` “Studio is for artists”; keep artist “All stash” tracks behind Studio access | `listener-account-and-signed-out-basics.md` | [#950](https://github.com/janiluuk/tahti-player/pull/950) |
| 3 | Mock Library Tracks ambient: ensure discography/sounds fixtures carry `bannerUrl` where covers exist; add SoundRow ambient Storybook story | `library-tracks-embed-layout-ambient.md` | [#959](https://github.com/janiluuk/tahti-player/pull/959) |
| 4 | Library Tracks embed: Storybook/play covering compact hearthis strip + ambient row (closes visual-check leftover for mock) | `library-tracks-embed-layout-ambient.md` | covered by [#949](https://github.com/janiluuk/tahti-player/pull/949) (row embed) + [#959](https://github.com/janiluuk/tahti-player/pull/959) (ambient Storybook) |
| 5 | Persist mock channel chat sends across reload (shared history store) | `MOCKS.md` thin + `fan-live-chat-discoverable.md` mock half | [#958](https://github.com/janiluuk/tahti-player/pull/958) |
| 6 | Stash share mock: create/revoke share round-trip works under `VITE_FORCE_MOCK` with toast + list refresh | `MOCKS.md` | [#961](https://github.com/janiluuk/tahti-player/pull/961) |
| 7 | Newsletter send confirmation in mock (success toast/state, not silent) | `MOCKS.md` | [#962](https://github.com/janiluuk/tahti-player/pull/962) |
| 8 | Queue collapse overlap: Storybook play asserting toggle box does not intersect first queue row; fold `queue-collapse-button-overlap.md` if green | `queue-collapse-button-overlap.md` | [#960](https://github.com/janiluuk/tahti-player/pull/960) |
| 9 | Channel page: tighter hero → stage rhythm (less stacked-block gap) without redesign | `channel-page-redesign.md` / `ui-nav-audit.md` | [#955](https://github.com/janiluuk/tahti-player/pull/955) |
| 10 | Channel page: comments composer uses library controls + fits at 390 px | `channel-page-redesign.md` | [#963](https://github.com/janiluuk/tahti-player/pull/963) |
| 11 | Channel page: live tracklist empty / offline empty uses shared EmptyState copy | `channel-page-redesign.md` | [#956](https://github.com/janiluuk/tahti-player/pull/956) |
| 12 | Fold `settings-audit.md` (decisions recorded; no open product questions left) | `settings-audit.md` | [#951](https://github.com/janiluuk/tahti-player/pull/951) |
| 13 | Storybook Combobox: disabled + empty-options + validation-error states | Storybook `Missing states:` | [#954](https://github.com/janiluuk/tahti-player/pull/954) |
| 14 | Storybook ChannelDesigner: empty/error visual-load state | Storybook `Missing states:` | [#964](https://github.com/janiluuk/tahti-player/pull/964) |
| 15 | Storybook ChannelDesigner Playlist: empty playlist state | Storybook `Missing states:` | [#957](https://github.com/janiluuk/tahti-player/pull/957) |
| 16 | Messages: empty thread pane EmptyState when a conversation has no messages | UX polish (MessagesView) | [#952](https://github.com/janiluuk/tahti-player/pull/952) |
| 17 | Studio home: first-broadcast EmptyState CTA points at Go live with clearer one-liner | UX polish (`StudioHomeView`) | [#953](https://github.com/janiluuk/tahti-player/pull/953) |
| 18 | Go-live checklist: when show title is filled / confirmed, mark “Show title ready” checked in mock UX | `artist-lifecycle` P2 leftover | [#965](https://github.com/janiluuk/tahti-player/pull/965) |
| 19 | Soft-pass snapshot debt: document confirm path + unit assertion that standing-only failures classify as soft-pass | `snapshot-digest-shows-history.md` | [#966](https://github.com/janiluuk/tahti-player/pull/966) |
| 20 | Phone Help / More drawer: first focusable item is not covered by a lingering Close tooltip after open | listener/phone leftover from signed-out audits | [#967](https://github.com/janiluuk/tahti-player/pull/967) |

## Rules

- Rebase onto `origin/master` before every push.
- Bump `packages/tahti-web` (and/or `ui`) patch for user-visible changes.
- Storybook-first; no email-as-name; no invented API.
- Leave this plan open until the batch is folded after merges (or user asks to fold).

## Blockers / skips

- `fan-live-chat-discoverable.md` real Centrifugo Send — needs live API / sibling, not this batch (slice 5 is mock-only).
- `sweep-leftovers.md` deploy tahti-org#834 — sibling deploy, out of scope.
- Full channel art-direction redesign — needs a reference; slices 9–11 are incremental only.
- Desktop-only leftovers (smart playlists 10k check, pro-library Phases 6–7, import-provider real set) — not mock-web.
- Main checkout had concurrent hearthis WIP — batch 66 work used isolated worktrees (`tahti-player-batch66`, `tahti-player-b66-*`).
