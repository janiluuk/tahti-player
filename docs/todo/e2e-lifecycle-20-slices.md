# Artist lifecycle e2e — 20 fix slices

**Status:** partial  
**Source:** `packages/tahti-web/docs/e2e-journeys/artist-lifecycle/ISSUES.md`

| # | Slice | PR |
| --- | --- | --- |
| 1 | Persist mock live signal/channel (sessionStorage) | #905 |
| 2 | Wire public `buildMockChannel` to mock LIVE slug | #911 |
| 3 | Set mock live slug on Go live | #912 |
| 4 | Mock `patchBroadcastPreflight` persists title | #905 (same as 1) |
| 5 | Top-nav Upload → `/library/upload` | #909 |
| 6 | Keep in-context Upload modal (AddToMusicActions) | deferred — no change needed |
| 7 | Align upload copy (page is canonical) | open |
| 8 | Mutable mock collection store | #906 |
| 9 | Navigate to new collection Design after create | #907 |
| 10 | Collection create tests for new slug | open |
| 11 | LIVE channel surfaces chat over comments | #916 |
| 12 | Chat block copy → live chat page | #914 |
| 13 | Inline chat while live (optional) | deferred |
| 14 | `/studio/channel` defaults to Setup | #908 |
| 15 | Persist channel tab in URL | open |
| 16 | Broadcast subnav first item “Go live” | #910 |
| 17 | Go live page title (less nesting) | #913 |
| 18 | Nav/tests for Go live labels | open |
| 19 | Mock preflight + title ready | #905 |
| 20 | Checklist → on-air UI when LIVE | #913 |

Also shipping from this chat (not e2e findings): #901 AmbientCard, #902 embed layout, #903 Shift+queue, #904 journey docs.
