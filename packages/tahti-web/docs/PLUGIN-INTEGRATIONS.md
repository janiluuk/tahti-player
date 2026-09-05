# Tahti add-on and plugin integration guide

Agent-facing reference for authoring, reviewing, and extending plugins in this checkout. The GitHub documentation version is [Tahti add-on and plugin authoring](../../docs/plugins/tahti-web-authoring.md), and the copyable standalone example is [`examples/tahti-plugin-example`](../../../examples/tahti-plugin-example).

This agent-facing guide explains how to extend the Tahti web client’s add-ons. The UI hosts two
related kinds of extension:

1. **Nuclear-style runtime plugins** under `src/plugins/`. These own a typed registry or behavior
   contract and can be tested independently.
2. **Tahti page add-ons** in `src/content/` and `PluginStorePanel.tsx`. These are user-enabled
   widgets or integrations whose configuration belongs in Settings → Add-ons.

Do not create a third settings destination for a new add-on. The add-on’s settings must be owned by
its registry/module and rendered by the existing category host. A provider should be removable
without breaking unrelated categories.

## Before writing code

1. Read the relevant entry in [`PLUGIN-STORE-PLAN.md`](../PLUGIN-STORE-PLAN.md).
2. Search the sibling `../tahti-org` checkout for the production page, API client, route, DTO, and
   database model. The sibling API is the contract source of truth; this repository is only the
   frontend half.
3. Confirm the API counterpart exists before adding a live operation. Record the exact method and
   path in the worklog. If there is no endpoint, implement a clearly labelled UI-only state or add
   the API task to the workplan—do not invent a successful mutation.
4. Decide whether the integration is a runtime provider, a configured page widget, or a deep-link
   to an existing Tahti flow. Keep those shapes separate.
5. If it is a marketplace/store plugin, check sibling `../tahti-registry` (`plugins.json`):
   a new plugin must appear there; a changed plugin must bump `version` (and `downloadUrl`).
   See root `AGENTS.md` → Plugin and theme registry.

## Plugin-owned settings

Each plugin should expose its own configuration shape, defaults, labels, help text, and validation.
The host should ask the plugin for those details and persist through the plugin’s API adapter. Keep
settings in the plugin boundary:

- use a local/state store for browser-only preferences;
- use an API client in `src/api/` for server-backed configuration;
- use `Dialog` or `ConfigurableCard` for forms too large for a catalog tile;
- show Configure only when a provider has configurable parameters;
- show configured/unconfigured and save/error feedback explicitly;
- never duplicate the same provider fields in Settings, Go Live, and a page widget.

For a standalone Nuclear plugin, follow `.agents/skills/writing-plugins/SKILL.md`: create a package
with `package.json`, `src/index.ts`, a `tahti` manifest, and a default `TahtiPlugin` export.
Use `api.Settings` for plugin-owned settings, `api.Http` for network access, and the relevant
provider registry for behavior. Validate user input before calling the host API.

## API parity checklist

For every feature, verify all of these against `../tahti-org` before calling it live:

- request method and path;
- request body/query names and enum values;
- response DTO shape and nullable fields;
- authentication and owner/board permissions;
- optimistic update rollback behavior;
- mock fixture shape for offline Playwright and component tests;
- loading, empty, error, and unavailable states.

The current counterpart inventory is intentionally explicit:

| Integration boundary | `../tahti-org` counterpart | Permission boundary |
| --- | --- | --- |
| User integrations | `apps/api/src/routes/me/integrations.ts` (`/api/me/integrations`) | Authenticated user; provider-specific OAuth/API-key validation |
| RTMP multicast | `apps/api/src/routes/me/rtmp-targets.ts` (`/api/me/rtmp-targets`) | Authenticated channel owner |
| Artist widgets | `apps/api/src/routes/me/disco-widgets.ts` (`/api/me/disco-widgets/installs`) | Authenticated artist |
| Admin widget catalog | `apps/api/src/routes/admin/disco-widgets.ts` (`/api/admin/disco-widgets`) | Board only |
| Audio editor | `apps/api/src/routes/me/archive-editor.ts` (`/api/me/archive/:id/editor/draft`) | Authenticated owner of archive item |
| Track insights | `apps/api/src/routes/me/track-insights.ts` | Authenticated owner or permitted viewer |
| Export/delivery | `apps/api/src/routes/releases` + `GET /api/me/export-plugins` | Authenticated artist; Revelator submit/status live |
| Scrobble (ListenBrainz / Last.fm) | `listenbrainz` install + `lastfm` OAuth start/callback + listen-events scrobble | Authenticated user; LB token validated on install; Last.fm needs `LASTFM_API_*`; scrobble is fire-and-forget after recorded listens |

The route file and shared Zod DTO win when the production UI, beta UI, and local assumptions disagree. Keep a short parity note beside every new adapter and update the workplan when a required route is absent.

The API route and shared DTO are authoritative when the production UI and beta UI differ. Add a
focused API wrapper rather than making components call `fetch` directly. Add registry-invariant
tests and user-facing coverage for every new configuration flow.

## Add-on types and current state

| Type | Registry/module | Purpose | Current state |
| --- | --- | --- | --- |
| Themes | `src/plugins/themes` | App palettes and imported custom themes | Implemented; browser-persisted |
| Visualizers | `src/plugins/visualizers` | Three.js channel visual scenes | Implemented; ten WebGL presets plus CSS-only Minimal |
| Audio plugins | `src/plugins/audio-fx` | Pro Editor EQ, compressor, limiter, and filter chain | Registry and preview graph implemented; generic third-party host UI pending |
| Reference mastering | `src/plugins/mastering` | Browser-only Matchering reference loudness/tonal-balance matching with a final limiter | Implemented; no API mutation — output is local WAV download/preview |
| Multicast | `src/plugins/multicast` + `api/broadcast.ts` | YouTube, Twitch, Kick, Facebook, TikTok, Mixcloud Live, Instagram, Custom RTMP | Provider registry and API typing implemented; shared add-target form pending |
| Export | `src/plugins/export` | DSP/export destinations and Revelator submit/status | Revelator runtime live via `GET /api/me/export-plugins`; other DSPs may still be metadata/deep-link only |
| Import / Sources | `src/plugins/import-sources` + `api/sources.ts` | OAuth sources, search sources, and link/tool imports | OAuth, search, and tool/upload adapters implemented; HTTP remains in `api/sources.ts` |
| Fingerprinting | `src/plugins/fingerprinting` | AcoustID match/check actions | Provider contract and AcoustID adapter implemented; additional providers pending |
| Scrobble | `src/plugins/scrobble` + `api/integrations.ts` | ListenBrainz submit-listens + Last.fm track.scrobble via integrations `SCROBBLE` | Implemented; charts/dashboard intentionally out of scope. See [scrobble README](../src/plugins/scrobble/README.md) and sibling `docs/technical/scrobble-plugin-contracts.md` |
| Radio | `content/radioStations.ts` | Configurable internet-radio stations | Page add-on implemented with local station configuration |
| Embed | embed add-on registry | SoundCloud, YouTube, and hearthis.at embeds | Implemented; provider configuration and shared playback are present |
| YouTube Liked Songs Sync | `src/plugins/youtube-liked-songs` + Nuclear add-on catalog | YouTube Music liked-song parsing and configuration | Parser and configuration are ported; secure Tahti sync/API contract is still missing |
| Multicast destinations | `src/plugins/multicast` + Nuclear add-on catalog | Provider RTMP destination configuration | Ready; uses `/api/me/rtmp-targets` and the shared destination form |
| Discovery | `content/listenerWidgets.ts` | Sandboxed Listen-page widgets | Implemented; catalog/runtime remains Tahti-specific |
| Channel | Disco widget manager | Public artist/channel widgets | Implemented; admin catalog supports registration/edit/delete |

## Three slices completed in this pass

1. Added this contract, API-parity, settings-ownership, and inventory guide.
2. Centralized visualizer descriptions and icons in `src/plugins/visualizers/meta.ts`; Channel
   Design and Add-ons now consume the same metadata.
3. Added registry coverage for every visualizer metadata entry and the unknown-id fallback.

## Three slices executed from the follow-up plan

1. **Plugin-owned settings schema:** Nuclear registry add-ons now describe input kinds (`text`, `password`, `url`, `textarea`, and `select`) and the Add-ons host renders the appropriate control instead of assuming every value is a plain text input.
2. **API counterpart metadata:** Each Nuclear registry add-on now records its implementation state, exact Tahti route counterparts, and the reason a partial or missing contract cannot be marked active.
3. **Authoring example:** Added a minimal installable settings plugin and a GitHub-facing tutorial covering lifecycle, settings ownership, provider registration, permissions, API parity, testing, and publishing.

## Remaining plugin work

- Extract a generic Audio FX chain host UI from `StudioProEditorView`.
- Share the multicast destination form between Go Live and Settings, keeping provider-specific
  credentials inside each provider configuration.
- ExportProvider submit/status/webhook contracts land in `../tahti-org` (`GET /api/me/export-plugins`); Nuclear `revelatorExportProvider` calls them.
- Integrations marketplace credentials: sibling `/api/me/integrations` + `SCROBBLE` ListenBrainz and Last.fm (see `src/plugins/scrobble`). Discovery dashboards still blocked.
- Remaining registry runtime blockers: `bandcamp-dashboard`, `deezer-dashboard`, `listenbrainz-dashboard` (charts), `omnisource`, `youtube-liked-songs-sync`.
