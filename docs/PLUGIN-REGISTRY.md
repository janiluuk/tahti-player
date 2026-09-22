# Plugin registry

How Tahti Player remembers which plugins are installed, and how that differs
from the marketplace catalog. Implementation lives in
[`packages/plugin-registry`](../packages/plugin-registry/README.md) (persistence)
and `packages/player/src/services/plugins/` (lifecycle).

## Three things called "registry"

Only the first is what `@tahti-player/plugin-registry` implements.

| Concept | What it is | Where |
| --- | --- | --- |
| **Runtime install registry** | Local list of _installed_ plugins (enabled flag, path, warnings) | `@tahti-player/plugin-registry` → Tauri `LazyStore('plugins.json')` in AppData |
| **Marketplace catalog** | Remote list of _available_ plugins (version, downloadUrl, repo) | `../tahti-registry` `plugins.json`, fetched by `packages/player/src/apis/pluginMarketplaceApi.ts` |
| **tahti-web Add-ons UI** | Browser over in-app subsystems (import, radio, widgets, export metadata) | `packages/tahti-web` `PluginStorePanel` — not the desktop runtime registry |

Both registry and catalog files are called `plugins.json`. They have different
hosts, schemas and roles; never merge or rename them without a migration plan.
The marketplace client class `PluginRegistryApi` refers to the **catalog**.

Also not the runtime registry: `widgetRegistry.ts` (in-memory SDK widget map),
tahti-web code registries (`import-sources`, `audio-fx`, `multicast`, `export`),
and the Tahti API `GET /api/me/import-plugins` / `export-plugins` catalogs.

Auto-update compares **catalog** `version`/`downloadUrl` against **runtime**
entries with `installationMethod: 'store'`. A version bump that never reaches
`tahti-registry` never reaches users. The process for changing the catalog is in
`../tahti-org/docs/technical/plugin-registry-process.md`.

## Persisted format

- **File:** `plugins.json`, via `@tauri-apps/plugin-store` `LazyStore`, in the
  Tauri AppData directory.
- **Keys:** `plugins.<id>` only; `listRegistryEntries` ignores any other key.
  The store is a flat key → value map, not a `{ plugins: [...] }` array.
- **Managed plugin files** are separate: `{appDataDir}/plugins/{id}/{version}/`
  (`pluginDir.ts`).
- **No schema version and no runtime validation.** Values are cast to
  `PluginRegistryEntry` on read.

```ts
type PluginRegistryEntry = {
  id: string;
  version: string;
  path: string; // absolute managed path …/plugins/{id}/{version}
  installationMethod: 'dev' | 'store';
  originalPath?: string; // dev only: source folder for reload
  enabled: boolean;
  installedAt: string; // ISO-8601
  lastUpdatedAt: string; // ISO-8601
  warnings?: string[]; // omitted when empty
};
```

```json
{
  "plugins.plain": {
    "id": "plain",
    "version": "1.0.0",
    "path": "/home/user/.local/share/<app-id>/plugins/plain/1.0.0",
    "installationMethod": "store",
    "enabled": false,
    "installedAt": "2025-01-01T00:00:00.000Z",
    "lastUpdatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

Test fixtures: `packages/player/src/test/builders/PluginRegistryEntryBuilder.ts`,
`packages/player/src/test/utils/seedPlugins.ts`.

## Package layout and boundaries

```
@tahti-player/plugin-registry        packages/player/src/services/plugins/
  contract.ts   types + constants      pluginRegistry*.ts   re-export shims (+ Logger wiring)
  registry.ts   LazyStore CRUD         pluginRegistryHost.ts PluginRegistryHost façade
  adapter.ts    PluginRegistryStore    pluginBootstrap / pluginAutoUpdate / pluginDir / PluginLoader
```

| Boundary | Owns | Does not own |
| --- | --- | --- |
| **Player core** (`packages/player`) | Bootstrap, `PluginLoader` host, managed dirs, Install/Installed UI, auto-update orchestration, `providersHost` wiring, the `PluginRegistryHost` implementation | Marketplace catalog content; tahti-web Add-ons; API import-provider list |
| **`@tahti-player/plugin-registry`** | `plugins.json` persistence and the `PluginRegistryStore` contract | Loading, downloading, install directories, UI |
| **Plugin SDK** (`packages/plugin-sdk`) | `TahtiPlugin` lifecycle, `TahtiPluginAPI`, manifest types, widget registry types | Persistence; download/install |
| **External plugins** | Implementation, `package.json` manifest, GitHub `plugin.zip` releases | Local install list |
| **tahti-registry** | Public catalog, versions and download URLs | Enable state; on-disk copies |
| **Import-provider plugins / tahti-web** | Studio import OAuth/search adapters; Settings → Add-ons; `GET /api/me/import-plugins` | Desktop runtime registry |
| **Tahti API** (`../tahti-org`) | Server import/export catalogs, credentials | Desktop `plugins.json` |

Only `pluginRegistry.ts`'s implementation (now in the package) may touch
`LazyStore`/`plugins.json`. Player code imports `pluginRegistryStore` from
`./pluginRegistryAdapter`; importing `./pluginRegistry` first is what wires the
player `Logger` in.

## Responsibilities

| Responsibility | Behaviour |
| --- | --- |
| Persist install list | Keyed entries in `plugins.json` |
| Discovery on startup | `list()`, sort by `installedAt` ascending, load only paths under the managed `plugins/` dir |
| Install (store) | Download zip → extract → `upsert` (`store`) → `loadPluginFromPath` → `enablePlugin` |
| Install (dev) | Pick folder → `loadPluginFromPath` copies into managed dir, upserts with `dev` + `originalPath` |
| Load / compile | `PluginLoader` reads `package.json`, compiles entry, creates instance + API (`createPluginAPI`) |
| Enable / disable | `enablePlugin`/`disablePlugin` call lifecycle hooks, then `setEnabled` |
| Warnings | Manifest/permission warnings on load; load failures on hydrate are merged into `warnings` and the entry is kept |
| Update (store) | After hydrate, `checkAndUpdatePlugins` if `core.plugins.autoUpdate`; higher semver in catalog → unload → load → re-enable |
| Reload (dev) | Re-read `originalPath`, reinstall managed copy, upsert |
| Removal | Unload → delete managed files → `remove` (also works for orphan entries) |

Out of scope: choosing active providers (`providersHost`, runs after hydrate) and
the marketplace browse UI.

## Contract mapping

`PluginRegistryStore` (package):

| Method | Behaviour |
| --- | --- |
| `list()` | All `plugins.*` entries, unsorted (bootstrap sorts) |
| `get(id)` | `undefined` when missing |
| `upsert(entry)` | Always calls `store.save()` |
| `setEnabled(id, enabled)` | No-op with a warn log if the entry is missing |
| `setWarnings(id, warnings)` | Empty array omits the `warnings` field |
| `remove(id)` | Deletes the `plugins.<id>` key |

`PluginRegistryHost` (implemented by `pluginRegistryHost.ts`):

| Method | Backed by |
| --- | --- |
| `hydrateFromRegistry()` | `hydratePluginsFromRegistry()` in `pluginBootstrap.ts` |
| `installFromPath()` | `usePluginStore.loadPluginFromPath` |
| `installFromMarketplace()` | `useInstallPlugin` mutation logic: catalog download → upsert → load → enable |
| `enable()` / `disable()` | `usePluginStore.enablePlugin` / `disablePlugin` |
| `reloadDev()` | `usePluginStore.reloadPlugin` (dev entries only) |
| `remove()` | `usePluginStore.removePlugin` |
| `checkAndUpdateStorePlugins()` | `checkAndUpdatePlugins()` in `pluginAutoUpdate.ts` |

## Callers

Persistence API consumers (all go through `pluginRegistryStore`):
`pluginBootstrap.ts`, `stores/pluginStore.tsx`, `pluginAutoUpdate.ts`,
`hooks/useInstallPlugin.ts`. `initPlayerApp.tsx` schedules
`hydratePluginsFromRegistry()`. UI: `views/Plugins/PluginStore.tsx`,
`InstalledPlugins.tsx`, `ConnectedPluginItem.tsx`. These do not touch
`plugins.json` keys: `PluginLoader`, `pluginDir`, `pluginDownloader`,
`pluginMarketplaceApi`.

Easy to mis-grep: tahti-web `PluginStorePanel`, `pluginInstallStore` and
`e2e/plugin-store.spec.ts` are Add-ons surfaces, not this registry.

## Bootstrap order

From `initPlayerApp.tsx`:

1. `initLogStream()`.
2. Await chain: settings → shortcuts → queue → favorites → playlists → core
   settings → discovery → MCP → MPD → HTTP API → bridge → Discord → playback
   bridge → history → language → theme watcher → marketplace themes → theme
   store hydrate → apply theme.
3. Fire-and-forget, not awaited before first paint: `hydratePluginsFromRegistry()`,
   app updater check, `ytdlpEnsureInstalled()`.
4. `root.render(<App />)` — plugins may still be loading while the UI mounts.

Inside `hydratePluginsFromRegistry()`:

1. `startStartup()`.
2. `list()`, sorted by `installedAt` ascending.
3. Skip entries whose `path` is not under the managed plugins dir (non-managed
   dev paths are intentionally unsupported).
4. Per entry: `PluginLoader` → metadata → API → load → put in `usePluginStore`
   with `enabled: false` → if the registry says `enabled`, call `enablePlugin`.
5. On load error: merge the message into the entry's `warnings`, keep the entry,
   register no in-memory plugin.
6. `providersHost.resolveActiveOnBootstrap()`.
7. `finishStartup(totalMs)`.
8. `void checkAndUpdatePlugins()` (respects `core.plugins.autoUpdate`).

Preserve this relative order: settings before hydrate, providers resolve after
plugin load, auto-update after hydrate. Do not make hydrate block first paint
without UX sign-off.

## Invariants

Must not change without a migration plan (existing users' installs depend on
them):

- File `plugins.json` via `LazyStore`; keys `plugins.<id>` only.
- Managed installs at `{appDataDir}/plugins/{id}/{version}/`.
- The bootstrap order above.
- The catalog stays separate (`tahti-registry`).

## Tests

The contract suite lives in `packages/player` because it needs the Tauri store
mocks. Every scenario below is covered; any replacement `PluginRegistryStore`
must pass it.

| Area | Scenarios | Suite |
| --- | --- | --- |
| Install | store install, dev install (`originalPath`), duplicate load is a no-op, failed load leaves no half-enabled plugin | `pluginRegistryHost.test.ts`, `pluginStore.test.ts`, `App.hydration.test.tsx` |
| Enable / disable | hooks + persistence, enabled flag respected on next startup, missing id throws | `pluginRegistryHost.test.ts`, `pluginStore.test.ts`, `App.hydration.test.tsx` |
| Warnings | unknown permissions, hydrate failure keeps entry, empty array omits field | `pluginStore.test.ts`, `App.hydration.test.tsx`, `pluginRegistryAdapter.test.ts` |
| Update | autoUpdate off, dev entries skipped, newer catalog version applied and re-enabled, missing catalog fields skipped, failed update keeps old version | `pluginAutoUpdate.test.ts`, `pluginRegistryHost.test.ts` |
| Removal | loaded and orphan entries, refuses delete outside the managed plugins dir | `pluginStore.test.ts`, `pluginRegistryHost.test.ts`, `pluginDir.test.ts` |
| Discovery | `installedAt` order, paths outside managed dir skipped, providers resolve after hydrate, per-plugin timings | `App.hydration.test.tsx`, `pluginRegistryHost.test.ts` |

Known: `App.hydration.test.tsx` had 6 failures on `master` when the package was
extracted, independent of that change.

## Rollback

The extraction is a pure move behind re-export shims. To roll back, point the
shims in `packages/player/src/services/plugins/pluginRegistry*.ts` back at an
in-repo implementation with the same storage keys; no data migration is needed.
Do not add dependency injection for the store until an alternative
implementation actually exists.

## Known risks

1. **Dual `plugins.json` names** — the biggest source of confusion.
2. **No runtime schema version** — any extraction to another repo should add read
   validation behind the adapter without changing on-disk keys.
3. **`useInstallPlugin` upserts twice** — once for the store entry, then
   `loadPluginFromPath` upserts again (path/version can change after the managed
   copy). Tests should lock the intended final entry shape.
4. **Hydrate is not awaited before render.**

## Future

Moving `@tahti-player/plugin-registry` to its own repo is optional and not
planned. If done, `PluginRegistryHost` stays in the player, and the package
must keep the same `PluginRegistryStore` contract and pass the suite above.
