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

## Leftovers

- Harden the bulk e2e against view-picker a11y names on CI
- Optional: notify toast when bulk-patch reports partial `failed[]` (fallback cap)

## Deferred outside this port

- Native desktop Phase 6–7 (`desktop-pro-library.md`)
- iTunes optional copy-into-folder (import already shipped; see explore notes)
