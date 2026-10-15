---
description: Package, release, and submit your plugin to the Tahti Player plugin store.
---

# Publishing

{% hint style="warning" %}
**Legacy: Nuclear plugin SDK.** This page describes the plugin SDK Tahti Player inherited from Nuclear. Since 2026-09 the Tahti Player app — desktop and web — no longer loads these plugins, so nothing on this page runs in the current app. To extend Tahti, see [Tahti add-on and plugin authoring](tahti-web-authoring.md).
{% endhint %}

Tahti Player's plugin store is backed by a static registry at [github.com/janiluuk/tahti-registry](https://github.com/janiluuk/tahti-registry). The registry lists plugin metadata (name, repo, category, version). The actual plugin code lives in the developer's own GitHub repository. When a user installs a plugin, Tahti Player uses the catalog `downloadUrl`; auto-update compares catalog `version` to the installed copy.

{% hint style="info" %}
This catalog replaced the upstream `NuclearPlayer/plugin-registry`. Submit listings only to `janiluuk/tahti-registry`. The manifest config field is `tahti` (see below); the old `nuclear` key is still read for backward compatibility.
{% endhint %}

Publishing a plugin takes three steps: configure your `package.json`, create a GitHub release with a `plugin.zip` asset, and add or update the listing in `tahti-registry`.

---

## package.json requirements

Your plugin's `package.json` must include these fields:

| Field | Required | Description |
|-------|----------|-------------|
| `name` | yes | Plugin identifier. Lowercase, hyphens allowed. Must match the `id` in the registry. |
| `version` | yes | Semver (e.g., `1.0.0`) |
| `description` | yes | Short description |
| `author` | yes | Your name or GitHub username |
| `main` | no | Entry point (e.g., `dist/index.js`). If omitted, Tahti Player tries `index.js`, `index.ts`, `index.tsx`, then `dist/index.*`. |

### The `tahti` field

The `tahti` field holds Tahti Player-specific config:

```json
{
  "tahti": {
    "displayName": "My Plugin",
    "categories": ["metadata"],
    "icon": {
      "type": "link",
      "link": "https://example.com/icon.png"
    },
    "permissions": ["network"]
  }
}
```

| Property | Required | Description |
|----------|----------|-------------|
| `displayName` | no | Human-readable name shown in the UI. Falls back to `name`. |
| `categories` | no | Array of categories. Valid values: `streaming`, `metadata`, `lyrics`, `scrobbling`, `dashboard`, `playlists`, `discovery`, `other`. Required for registry submission. |
| `icon` | no | Plugin icon. Only `{"type": "link", "link": "url"}` is supported. |
| `permissions` | no | Informational list. No permissions are enforced yet; this is for future use. |

{% hint style="info" %}
A plugin can belong to multiple categories. Pick all that apply based on the provider types your plugin registers.
{% endhint %}

{% hint style="warning" %}
`nuclear` is still read as a legacy alias for `tahti` (identical shape) for plugins published before the rebrand. If both are present, `tahti` wins. New and updated plugins should use `tahti`.
{% endhint %}

### Full example

```json
{
  "name": "nuclear-plugin-discogs",
  "version": "1.0.0",
  "description": "Fetch album and artist metadata from Discogs",
  "author": "nukeop",
  "license": "MIT",
  "main": "dist/index.js",
  "tahti": {
    "displayName": "Discogs",
    "categories": ["metadata"]
  }
}
```

---

## Creating a GitHub release

1. Tag your commit with a semver version (e.g., `v1.0.0`).
2. Create a GitHub release from that tag.
3. Attach a file named exactly `plugin.zip` as a release asset.
4. Publish the release.

Tahti Player looks for an asset named `plugin.zip` in the latest release. If it's missing, installation fails.

### What goes in plugin.zip

The zip should contain your built plugin files at the root level, not nested in a subdirectory:

```
plugin.zip
├── index.js          # Entry point (or whatever `main` points to)
├── package.json      # Plugin metadata
└── ...               # Any other files your plugin needs
```

{% hint style="warning" %}
Files must be at the root of the zip, not inside a subdirectory. If your zip contains `my-plugin/index.js` instead of `index.js`, the plugin won't load.
{% endhint %}

Tahti Player can compile TypeScript on the fly, so you can ship `.ts` or `.tsx` source files instead of pre-built JavaScript. Pre-building is recommended for faster load times.

Set up CI to build and create the release automatically. Manual zip creation is error-prone.

---

## Submitting to the registry

1. Prefer a sibling checkout at `../tahti-registry`; otherwise fork [janiluuk/tahti-registry](https://github.com/janiluuk/tahti-registry).
2. Add your plugin to the `plugins` array in `plugins.json`:

```json
{
  "id": "nuclear-plugin-discogs",
  "name": "Discogs",
  "description": "Fetch album and artist metadata from Discogs",
  "author": "nukeop",
  "repo": "NuclearPlayer/nuclear-plugin-discogs",
  "category": "metadata",
  "categories": ["metadata"],
  "tags": ["discogs", "metadata"],
  "version": "1.0.0",
  "downloadUrl": "https://github.com/NuclearPlayer/nuclear-plugin-discogs/releases/download/v1.0.0/plugin.zip",
  "addedAt": "2026-01-25T00:00:00Z"
}
```

3. Open a pull request.

### Registry entry fields

| Field | Required | Constraints |
|-------|----------|-------------|
| `id` | yes | Must match `name` in your `package.json`. Lowercase, hyphens, 2-64 chars. |
| `name` | yes | Display name, 1-64 chars. |
| `description` | yes | 10-200 chars. |
| `author` | yes | 1-64 chars. |
| `repo` | yes | `owner/repo-name` format. |
| `category` | yes | Must match your `package.json` `tahti.category`. |
| `categories` | yes | Array of categories matching your plugin's provider types. Same valid values as `tahti.categories` in package.json. |
| `tags` | no | Up to 10 tags, lowercase with hyphens, unique. |
| `version` | no | Latest released semver version. Populated automatically by CI. |
| `downloadUrl` | no | Direct URL to the latest `plugin.zip`. Populated automatically by CI. |
| `addedAt` | yes | ISO 8601 datetime (e.g., `2026-01-25T00:00:00Z`). |

---

## Updating your plugin

1. Bump `version` in the plugin `package.json`.
2. Create a new GitHub release with an updated `plugin.zip`.
3. **Update `tahti-registry` in the same change set** — set the matching `plugins.json` `version` and `downloadUrl` to the new release. Auto-update will not reach users until the catalog version is newer than the installed copy.
4. Run `pnpm validate` / `pnpm check-plugins` in `tahti-registry`.

A new plugin is not published until its row exists in `tahti-registry` `plugins.json`. Users should be able to see it in that repository.

Only a catalog PR (or sibling commit) is enough for metadata-only edits (description, category, tags) that do not need a new zip.

{% hint style="info" %}
Tahti Player checks for plugin updates on startup. If auto-update is enabled (it is by default), installed store plugins are automatically updated to the latest **catalog** version. Users can disable this in Settings under Plugins.
{% endhint %}

## Examples

You can find example plugins on Github: [github.com/NuclearPlayer](https://github.com/NuclearPlayer).