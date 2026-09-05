---
description: Agent and contributor guide for extending Tahti add-ons and Tahti Player plugins safely.
---

# Tahti add-on and plugin authoring

This page is the GitHub-hosted contributor guide for extending the Tahti web client. It complements the general [plugin system](plugin-system.md), [settings](settings.md), and [providers](providers.md) references.

{% hint style="warning" %}
Tahti web has no backend of its own. Before adding a live integration, inspect the sibling `../tahti-org` repository. Its Fastify route, shared DTO, permission check, and persistence behavior are the API contract.
{% endhint %}

## Choose the right extension type

| Type | Use it for | Tahti web location |
| --- | --- | --- |
| Runtime provider | Search, stream resolution, metadata, playlists or discovery behavior in Tahti Player | `packages/tahti-web/src/plugins/` or `packages/plugin-sdk` |
| Audio FX | A Pro Editor effect that contributes preview nodes and render parameters | `src/plugins/audio-fx` |
| Visualizer | A Three.js scene preset reacting to artwork and analyser level | `src/plugins/visualizers` |
| Source adapter | OAuth, search, link import or file import behavior | `src/plugins/import-sources` plus `src/api/sources.ts` |
| Page add-on | A configurable radio, embed, discovery or channel widget | `src/content/` and the Add-ons category host |
| Export or multicast target | A delivery destination or RTMP mirror | `src/plugins/export` or `src/plugins/multicast` |
| Fingerprinting | Audio identification or metadata matching | `src/plugins/fingerprinting` |
| Scrobble | Submit listens to ListenBrainz (and later Last.fm) via `/api/me/integrations` | `src/plugins/scrobble` |
| Theme | A palette or imported appearance | `src/plugins/themes` |

Do not call a metadata array a runtime plugin. A registry entry is only active when it has behavior, validation, settings ownership, and a verified API or host contract.

## Standalone plugin recipe

The working example is [`examples/tahti-plugin-example`](../../examples/tahti-plugin-example). It is intentionally small and can be copied as a starting point.

```text
my-plugin/
  package.json
  src/
    index.ts
```

The manifest must include a unique name, version, description, author, entry point, `tahti.categories`, and only the permissions the plugin needs. Export one default `TahtiPlugin` object. Register behavior in `onEnable`; unregister providers and widgets in `onDisable`.

{% code title="package.json" %}

```json
{
  "name": "tahti-plugin-example",
  "version": "0.1.0",
  "main": "src/index.ts",
  "type": "module",
  "tahti": {
    "displayName": "Example settings plugin",
    "categories": ["other"],
    "permissions": ["storage"]
  },
  "dependencies": {
    "@tahti-player/plugin-sdk": "^2.8.0"
  }
}
```

{% endcode %}

## Plugin-owned settings

Settings belong to the plugin that consumes them. Register the complete definition, including the default, user-facing explanation, input kind, validation bounds and whether a value is secret. Use `api.Settings.get`, `set`, and `subscribe` with the bare setting ID; the host namespaces it per plugin.

For a Tahti page add-on, put the equivalent schema next to the add-on registry and let the shared Add-ons host render it. Do not duplicate the same API key or URL field in Settings, Go Live and a page widget. Secrets must never be placed in a public URL, mock fixture, screenshot, or README.

## API-counterpart gate

Before marking an integration available, record and verify:

1. the exact `../tahti-org` method and route;
2. request body, query names and enum values;
3. response DTO, nullable fields and error responses;
4. authentication, owner/artist/board permission checks;
5. persistence and rollback behavior;
6. mock fixtures and loading, empty, error and unavailable states;
7. a focused test that proves the adapter sends the agreed contract.

Useful counterpart locations include `../tahti-org/apps/api/src/routes/me`, `../tahti-org/apps/api/src/routes/admin`, and `../tahti-org/packages/shared/src/dto`. For example, RTMP destinations are defined by `/api/me/rtmp-targets`, widget management by `/api/admin/disco-widgets`, and user integrations by `/api/me/integrations`. If no counterpart exists, expose configuration as clearly labelled pending/UI-only state and add the missing API work to the Tahti workplan. Never invent a successful mutation.

## Existing integration inventory

| Integration | Behavior today | API parity state |
| --- | --- | --- |
| Themes | Built-in and imported themes | Implemented locally; no Tahti API required |
| Visualizers | Eleven selectable presets, including Minimal | Implemented in the browser |
| Audio FX | EQ, compressor, limiter and filter preview registry | Preview host implemented; generic third-party UI pending |
| Multicast | Eight typed RTMP providers with CRUD | `/api/me/rtmp-targets` implemented; shared form extraction pending |
| Import / Sources | OAuth, search, link and tool source families | OAuth, search, and tool/upload adapters implemented; HTTP remains in `api/sources.ts` |
| Export | Destination registry and Revelator submit/status | Revelator runtime live via `/api/me/export-plugins`; other DSPs may still be deep links |
| Fingerprinting | AcoustID match and check adapter | One provider implemented; more providers pending |
| Scrobble (ListenBrainz / Last.fm) | Submit-listens / track.scrobble after recorded listen-events | Integrations `SCROBBLE` scope; Settings → Add-ons → Scrobbling. Sibling: `../tahti-org/docs/technical/scrobble-plugin-contracts.md`. Charts stay out of scope |
| Radio and embeds | Configurable stations and SoundCloud/YouTube/hearthis.at embeds | Page add-ons implemented; provider-specific runtime varies |
| Discovery and channel widgets | Sandboxed listener/channel catalog | `/api/admin/disco-widgets` and install routes available; UI parity continues |
| Tahti Player registry integrations | Discogs, Deezer, YouTube, Bandcamp, SoundCloud and OmniSource entries | Status varies; ListenBrainz + Last.fm scrobble are live; chart dashboards and OmniSource remain planned. See `packages/tahti-web/docs/PLUGIN-INTEGRATIONS.md` |

## Current three-slice follow-up

The unfinished work is tracked in [`packages/tahti-web/WORKPLAN.md`](../../tahti-web/WORKPLAN.md). The next safe slices are:

- extract one generic Audio FX chain host so plugin-owned controls replace the current per-plugin branches;
- extract one shared multicast destination form used by Settings and Go Live.

Each slice should land with a registry test, an API-parity note, a mock state, and a user-facing empty/error state. Remaining registry runtime blockers (Bandcamp/Deezer/ListenBrainz chart dashboards, OmniSource, YouTube liked-songs sync) stay planned until sibling contracts exist.

## Review checklist

- Is the extension independently removable?
- Does its configuration live at the extension boundary?
- Does every network operation have a verified sibling API counterpart?
- Are credentials validated, masked and excluded from logs?
- Are register/unregister lifecycle paths covered?
- Does the UI use Tahti Player components and i18n conventions?
- Are type-check, lint, focused tests and the relevant Playwright route capture clean?
- If this is a Store plugin: does `../tahti-registry` `plugins.json` list it (new) or
  show a bumped `version`/`downloadUrl` (changed)?
