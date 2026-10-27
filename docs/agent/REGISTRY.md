# REGISTRY

Extracted from root `AGENTS.md` for on-demand reading.

## Plugin and theme registry (`tahti-registry`)

The official marketplace catalog — what users see in the player Store — is
[github.com/janiluuk/tahti-registry](https://github.com/janiluuk/tahti-registry)
(`plugins.json`, `themes/`, generated `themes.json`). It is served from
`https://raw.githubusercontent.com/janiluuk/tahti-registry/master`. The Nuclear
desktop client that fetched it (`packages/player/src/apis/pluginMarketplaceApi.ts`,
`themeRegistryApi.ts`) was removed with the dead desktop UI in 2026-10 (last at
`d703e03cf`); tahti-web has no catalog client yet. It replaces the upstream
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

### Runtime registry invariants

The runtime registry lives in `@tahti-player/plugin-registry`
(own repo, [janiluuk/tahti-plugin-registry](https://github.com/janiluuk/tahti-plugin-registry), pinned by tag); the player's `pluginRegistry*.ts` files are
re-export shims and `PluginRegistryHost` stays in the player. Ownership split
and rollback plan are in [`docs/PLUGIN-REGISTRY.md`](../PLUGIN-REGISTRY.md).
Do not change registry keys, storage location, discovery semantics, or
bootstrap order without a migration plan: existing installs depend on them.
