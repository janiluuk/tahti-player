# Plugin registry extraction — pointer

**Status:** open

## Remaining

pointer to sibling checklist. **2026-09-07:** the sibling doc's §5.1/§5.2
adapter is now implemented here — `packages/player/src/services/plugins/
pluginRegistryContract.ts` + `pluginRegistryAdapter.ts`, additive only
(existing callers still import `pluginRegistry.ts` directly; migrating
them is §5.4, not done yet). A first contract-test suite exists
(`pluginRegistryAdapter.test.ts`, store-layer subset).

**2026-09-08:** the §5 `PluginRegistryHost` half (previously unimplemented)
now exists too — `pluginRegistryHost.ts`, a thin façade composing
`pluginBootstrap`/`pluginStore`/`pluginAutoUpdate` behind the interface
without changing their behavior (still additive; existing call sites are
unchanged, migrating them is still §5.4). `pluginRegistryHost.test.ts`
covers all 8 interface methods (12 tests) — install-from-marketplace
(including the double-upsert entry-shape lock flagged in the sibling doc's
open-risks §3), install-from-path, enable/disable, reloadDev, remove,
checkAndUpdateStorePlugins, and hydrateFromRegistry (incl. confirming
`providersHost.resolveActiveOnBootstrap` runs after the hydrate loop).
Full `../tahti-player` plugin test suite (78 tests) still green.

Canonical inventory and remaining-work checklist live in the Tahti org repo
(remaining-work is tracked there):

**[`../../tahti-org/docs/todo/plugin-registry-extraction.md`](../../../tahti-org/docs/todo/plugin-registry-extraction.md)**

Absolute path (same machine layout):
`/home/jani/workspace/tahti-org/docs/todo/plugin-registry-extraction.md`

Do not migrate or change runtime registry keys / bootstrap here until that
doc’s adapter + contract-test checklist is accepted. See also root
`AGENTS.md` → *Runtime registry separation guardrail*.
