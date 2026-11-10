# Library management port (theDAW → Library Sounds UI)

**Status:** partial  
**Updated:** 2026-11-10  
**Sibling:** `../tahti-org/docs/todo/library-management-port.md` (API)

Wire Studio / Library → Sounds to the tahti-org management endpoints. Native
local files already have this stack; this todo is cloud Sounds only.

## Shipped

- [x] Client: page / ids / facets / stats / bulk-delete / bulk-patch
- [x] Server-driven list, stats strip, Genre/Tag facets, Mix order
- [x] Selection bar: select-all matching, bulk delete/edit
- [x] Select-all-matching → Mix order (ids) + Add to release (title resolve)
  (`feat/library-mgmt-followups`, #1991)

## Next 20 slices (in order)

Canonical table lives in the sibling org todo (same numbering). Player-owned
rows below; org rows are blockers for the matching UI.

| # | Repo | Slice | Done when |
| - | ---- | ----- | --------- |
| 1 | org | Bulk-by-ids: report non-owned ids in `failed[]` | — |
| 2 | org | Bulk-patch `isFallback` rotation parity | — |
| 3 | org | Bulk-patch `isPublic` follower notify | — |
| 4 | org | OpenAPI bulk request + 409 shapes | — |
| 5 | org | OpenAPI dual GET `/api/me/sound` | — |
| 6 | org | Facets tag without 5k sample | — |
| 7 | org | Facets uploadedYear omit date filters | — |
| 8 | org | Library-mgmt integration tests in CI | — |
| 9 | org | `POST …/covers/backfill` | — |
| 10 | org | Bulk mutate `where` includes `channelId` | — |
| 11 | player | Filters: BPM + key | SoundFilters wired to API |
| 12 | player | Filters: status + visibility + pinned | SoundFilters wired |
| 13 | player | Bulk edit: `genreCustom` | Dialog |
| 14 | player | Bulk edit: license / downloads / comments | Dialog + i18n |
| 15 | player | Bulk edit: `releasedAt` (+ fallback after org #2) | Dialog |
| 16 | player | Selection outside list view (or clear on leave) | Consistent UX |
| 17 | player | Single selection toolbar in list view | No duplicate toolbars |
| 18 | player | Covers backfill UI (needs org #9) | Button + toast |
| 19 | org+player | Full Suggest playlist (duration/flow) or wontfix | Product call |
| 20 | player | E2E: select-all → bulk edit/delete + Mix order | Journey on mock |

## Deferred outside these 20

- Native desktop Phase 6–7 (`desktop-pro-library.md`)
