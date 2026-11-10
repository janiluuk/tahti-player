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
- [x] Filters: BPM + key, status + visibility + pinned
- [x] Bulk edit: genreCustom, license, downloads, comments, releasedAt, isFallback
- [x] Selection clears when leaving list density
- [x] List view: CatalogTable hides inline selection chrome (SoundsSelectionBar only)
- [x] Covers backfill button (calls org `POST …/covers/backfill`)
- [x] Suggest playlist beyond Mix order — **wontfix** (org)
- [x] E2E journey sketch: `e2e/library-sounds-bulk.spec.ts`
- [x] Ambient titles strip leading artist when artist is listed beside them
- [x] CardsRow fade-out on item removal (favorites / filter / any drop)
- [x] Input end-addon active only when field modified (filter search)

## Next 30 slices

Canonical table lives in the sibling org todo (same numbering). Player-owned
rows below; org rows are blockers for the matching UI. PR for prior UI: #1992.

| # | Repo | Slice | Done when |
| - | ---- | ----- | --------- |
| 1–10 | org | See sibling (413 OpenAPI, pinned/clear-tags bulk, multi-tag, key facet, year SQL, admin delete/page, tests) | — |
| 11 | player | Honesty toast when bulk `ok` but `failed.length > 0` | ✅ |
| 12 | player | Map 409 `totalMatched` to re-confirm dialog | Retry with server count |
| 13 | player | Surface ids `413` as toolbar `selectionNotice` | ✅ |
| 14 | player | Pass `serverFilter` into facets; refetch on filter change | ✅ |
| 15 | player | `uploadedYear` facet Select → year date bounds | Year dropdown |
| 16 | player | Facet-backed counts on contentType / source / status | Labels with counts |
| 17 | player | `isFallback` filter | ✅ |
| 18 | player | Always-visible Clear filters when active | ✅ |
| 19 | player | Active-filter chip strip | Per-chip remove |
| 20 | player | Search clear `endAddon` idle→active | ✅ |
| 21 | player | Shift-click range select via ordered ids | Inclusive across pages |
| 22 | player | Bulk edit: `subGenres` | Dialog + API |
| 23 | player | Bulk edit: clear-tags (after org #4) | `tags: []` |
| 24 | player | Bulk genre options from live facets | Facet + Other |
| 25 | player | Stats strip clickable → filters | Visibility/status |
| 26 | player | Tag multi-select (after org #5) | AND tags |
| 27 | player | `musicalKey` facet Select (after org #6) | Facet buckets |
| 28 | player | Admin ChannelTracksPanel Remove + richer edit | Admin delete + patch |
| 29 | player | Admin channel tracks paged/filtered (after org #9) | No 200 cap |
| 30 | player | Harden bulk e2e + units for #11/#14/#21 | Stable a11y; coverage |

## Deferred outside this port

- Native desktop Phase 6–7 (`desktop-pro-library.md`)
- iTunes optional copy-into-folder (import already shipped)
