# Library management port (theDAW → Library Sounds UI)

**Status:** partial  
**Updated:** 2026-11-03  
**Sibling:** `../tahti-org/docs/todo/library-management-port.md` (API)

Wire Studio / Library → Sounds to the new tahti-org management endpoints
(paged list, facets, stats, matching ids, bulk delete/patch). Native local
files already have this stack; this todo is cloud Sounds only.

## UI checklist (this repo)

- [x] `studio-sounds` client: page / ids / facets / stats / bulk-delete / bulk-patch
- [x] Server-driven `useStudioSoundsState` (debounce `q`, discard stale)
- [x] Stats strip on the Sounds list; Genre/Tag facet filters (#1855); Mix order from the selection (#1851, tahti-org#1070)
- [x] Selection bar: select-all matching, bulk delete, bulk edit
- [x] Route allowlist / API-REFERENCE / tests

## Deferred

- Native desktop Phase 6–7 leftovers (`desktop-pro-library.md`)
