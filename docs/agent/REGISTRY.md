# REGISTRY

Extracted from root `AGENTS.md` for on-demand reading.

## Plugin and theme registry (`tahti-registry`)

The official marketplace catalog — what users see in the player Store — is
[github.com/janiluuk/tahti-registry](https://github.com/janiluuk/tahti-registry)
(`plugins.json`, `themes/`, generated `themes.json`). The player fetches it from
`https://raw.githubusercontent.com/janiluuk/tahti-registry/master` via
`packages/player/src/apis/pluginMarketplaceApi.ts` and
`packages/player/src/apis/themeRegistryApi.ts`. It replaces the upstream
`NuclearPlayer/plugin-registry` and `NuclearPlayer/theme-registry` repos.

Do not confuse it with the player's **runtime** install list (`plugins.json` on
disk). That file is what is already installed locally. The catalog is
`tahti-registry`. Auto-update compares the catalog `version`/`downloadUrl` to
the installed copy — a code-only bump that never lands in the catalog will not
reach users.

Prefer a sibling checkout at `../tahti-registry` (same parent as this repo and
`../tahti-org`). Otherwise clone or open a PR against that GitHub repo.

### After every plugin or theme change (required)

Before treating plugin work as done, open `../tahti-registry` (or fetch
`plugins.json` from GitHub) and check the listing:

1. **Added a plugin or theme** — it must have a new row in `plugins.json` (or
   `themes/`). Users must be able to see it in that repo. Do not ship a store
   plugin only in this monorepo.
2. **Changed an existing plugin or theme** (behavior, metadata, repo, category,
   download URL, listing id) — bump the plugin's own `package.json` `version`
   **and** the matching `version` (and `downloadUrl` / release tag) in
   `tahti-registry`. Cut a GitHub release with `plugin.zip` when the store
   install path is used.
3. **Renamed, recategorized, retargeted, or removed** — update or delete the
   catalog row in the same change set.
4. Run that repo's `pnpm validate` / `pnpm check-plugins` (and the theme
   validators). Do not leave the catalog stale.

In-app Tahti page add-ons (Settings → Add-ons widgets that are not marketplace
zips) stay owned here, but if they also have a public store listing, that
listing still lives in `tahti-registry`.

### Runtime registry separation guardrail

Separating the plugin registry conceptually is **in progress, not done** — do
not break or migrate the current runtime registry. Shipped so far, in this
repo: `pluginRegistryContract.ts` (types + `PluginRegistryStore` /
`PluginRegistryHost` interfaces), `pluginRegistryAdapter.ts` (LazyStore
adapter, `pluginRegistryStore` singleton), `pluginRegistryHost.ts` (façade
composing `pluginBootstrap`/`pluginStore`/`pluginAutoUpdate` behind the
interface), and caller migration off direct `pluginRegistry.ts` imports (PR
#46). Contract tests (`pluginRegistryAdapter.test.ts`,
`pluginRegistryHost.test.ts`, plus existing store/hydration/auto-update
suites) cover the §6 scenarios from
`../tahti-org/docs/todo/plugin-registry-extraction.md`. The two former unit
gaps (enable/disable persistence across restart; refuse delete outside the
managed plugins dir) are covered by `App.hydration.test.tsx` and
`pluginDir.test.ts` (see `docs/todo/HISTORY.md` 2026-09-15).

Still required before real extraction: a migration/rollback plan and sign-off
on the ownership split (player core / plugin SDK / import-provider plugins /
tahti-registry / Tahti API — drafted in the sibling doc's §7). Until then, do
not change registry keys, storage location, discovery semantics, or bootstrap
order.
