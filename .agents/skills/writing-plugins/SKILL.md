---
name: writing-plugins
description: Use when writing, scaffolding, or modifying Tahti Player plugins. Covers plugin structure, manifest, entry point, provider types, available APIs, and publishing. Trigger phrases include "create a plugin", "write a plugin", "plugin scaffold", "streaming provider", "metadata provider".
---

# Writing Tahti Player Plugins

Plugins are standalone repos compiled in-browser via esbuild-wasm.

## Structure

```
my-plugin/
  package.json      # Manifest with tahti metadata
  src/
    index.ts        # Entry point, default exports TahtiPlugin
```

## Manifest (package.json)

```json
{
  "name": "tahti-plugin-example",
  "version": "0.1.0",
  "description": "What this plugin does",
  "author": "Your Name",
  "license": "AGPL-3.0-only",
  "main": "src/index.ts",
  "type": "module",
  "tahti": {
    "displayName": "Example Plugin",
    "category": "streaming",
    "icon": { "type": "link", "link": "https://example.com/icon.svg" }
  },
  "dependencies": {
    "@tahti-player/plugin-sdk": "^1.1.0"
  }
}
```

Categories: `streaming`, `metadata`, `lyrics`

## Entry Point

```typescript
import type { TahtiPlugin, TahtiPluginAPI } from '@tahti-player/plugin-sdk';

const plugin: TahtiPlugin = {
  onLoad(api: TahtiPluginAPI) {},
  onEnable(api: TahtiPluginAPI) {
    // Register providers
  },
  onDisable() {
    // Unregister providers
  },
  onUnload() {},
};

export default plugin;
```



## Provider Types

**Streaming** - resolve tracks to playable audio:

```typescript
const provider: StreamingProvider = {
  id: 'my-streaming',
  kind: 'streaming',
  name: 'My Streaming',
  async searchForTrack(artist, title, album?) { /* return StreamCandidate[] */ },
  async getStreamUrl(candidateId) { /* return Stream */ },
};

api.Providers.register(provider);
api.Providers.unregister('my-streaming');
```

**Metadata** - search artists/albums, fetch details:

```typescript
const provider: MetadataProvider = {
  id: 'my-metadata',
  kind: 'metadata',
  name: 'My Metadata',
  searchCapabilities: ['artists', 'albums'],
  streamingProviderId: 'my-streaming', // Optional: locks streaming to this provider
  async searchArtists(params) { /* ... */ },
  async searchAlbums(params) { /* ... */ },
  async fetchArtistBio(id) { /* ... */ },
  async fetchAlbumDetails(id) { /* ... */ },
};
```



## Available APIs

- `api.Providers` - register/unregister providers
- `api.Settings` - plugin settings storage
- `api.Http` - fetch wrapper
- `api.Ytdlp` - yt-dlp integration
- `api.Queue` - playback queue control
- `api.Metadata` - search music metadata
- `api.Streaming` - resolve streams
- `api.Logger` - logging (trace/debug/info/warn/error)



## Publishing

1. Create a GitHub repo with the plugin code
2. Add `.github/workflows/release.yml`:

```yaml
name: Release
on:
  push:
    tags: ['v*']
jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v7
      - run: zip -r plugin.zip src package.json README.md
      - uses: softprops/action-gh-release@v2
        with:
          files: plugin.zip
          generate_release_notes: true
```

1. Bump `package.json` `version`, tag the release (`git tag vX.Y.Z && git push origin vX.Y.Z`).
2. Update [janiluuk/tahti-registry](https://github.com/janiluuk/tahti-registry) `plugins.json` in
  the same change set (sibling `../tahti-registry`):
  - **New plugin** — add a row. Users must see it in that repo.
  - **Changed plugin** — bump the catalog `version` and `downloadUrl` to the new release.
  Player auto-update reads the catalog, not GitHub latest alone.
3. Run `pnpm validate` / `pnpm check-plugins` in `tahti-registry`. Do not use
  `NuclearPlayer/plugin-registry`.

