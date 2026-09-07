# Plugin registry extraction — pointer

**Status:** open

## Remaining

pointer to sibling checklist. **2026-09-07:** the sibling doc's §5.1/§5.2
adapter is now implemented here — `packages/player/src/services/plugins/
pluginRegistryContract.ts` + `pluginRegistryAdapter.ts`, additive only
(existing callers still import `pluginRegistry.ts` directly; migrating
them is §5.4, not done yet). A first contract-test suite exists
(`pluginRegistryAdapter.test.ts`, store-layer subset).

Canonical inventory and remaining-work checklist live in the Tahti org repo
(remaining-work is tracked there):

**[`../../tahti-org/docs/todo/plugin-registry-extraction.md`](../../../tahti-org/docs/todo/plugin-registry-extraction.md)**

Absolute path (same machine layout):
`/home/jani/workspace/tahti-org/docs/todo/plugin-registry-extraction.md`

Do not migrate or change runtime registry keys / bootstrap here until that
doc’s adapter + contract-test checklist is accepted. See also root
`AGENTS.md` → *Runtime registry separation guardrail*.
