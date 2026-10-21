---
description: Create and load your first Tahti Player plugin and verify the SDK works end-to-end.
---

# Getting started with plugins

{% hint style="warning" %}
**Legacy: Nuclear plugin SDK.** This page describes the plugin SDK Tahti Player inherited from Nuclear. Since 2026-09 the Tahti Player app — desktop and web — no longer loads these plugins, so nothing on this page runs in the current app. To extend Tahti, see [Tahti add-on and plugin authoring](tahti-web-authoring.md).
{% endhint %}

Spin up a bare plugin, load it in Tahti Player, and poke the Plugin SDK to make sure everything is wired.

{% hint style="info" %}
Plugins are folders on disk with a `package.json` and an entry file. The app loads them at runtime and provides `@tahti-player/plugin-sdk` to your code.
{% endhint %}

## Usage

{% tabs %}
{% tab title="1) Folder" %}
Create a folder anywhere on your machine, e.g. `~/tahti-plugins/hello-plugin`.

Run `npm init` inside.
{% endtab %}

{% tab title="2) package.json" %}
```json
{
  "name": "hello-plugin",
  "version": "0.1.0",
  "description": "Minimal Tahti Player plugin",
  "author": "Your Name",
  "main": "index.ts",
  "tahti": {
    "displayName": "Hello Plugin",
    "categories": ["other"]
  }
}
```
{% endtab %}

{% tab title="3) index.ts" %}
```typescript
const CATEGORY = "Examples";

module.exports = {
  async onLoad(api) {
    await api.Settings.register([
      {
        id: "hello",
        title: "Hello world",
        category: CATEGORY,
        kind: "boolean",
        default: true
      }
    ]);

    const v = await api.Settings.get("hello");
    await api.Settings.set("hello", !v);
  },

  async onEnable(api) {
  api.Settings.subscribe("hello", () => {});
  }
};
```

The app compiles TS on the fly. No additional setup is needed.
{% endtab %}
{% endtabs %}

## Load it in the app

1. Open Tahti Player → Preference → Plugins (from the left sidebar).
2. Click Add Plugin and select your plugin folder.
3. Toggle it on. `onLoad` runs at import time; `onEnable` runs when you enable.

## Verify the SDK

* Open Settings and find the "Examples" section. You should see "Hello world" with a toggle.
* Flip it. The value persists to disk and updates subscribers.

{% hint style="warning" %}
Setting IDs are auto-namespaced. Use bare IDs like `hello`; the app stores them as `plugin.<pluginId>.hello`.
{% endhint %}

## Plugin shape

```typescript
type Plugin = {
  onLoad?(api: TahtiPluginAPI): void | Promise<void>;
  onEnable?(api: TahtiPluginAPI): void | Promise<void>;
  onDisable?(api: TahtiPluginAPI): void | Promise<void>;
  onUnload?(api: TahtiPluginAPI): void | Promise<void>;
};
```

`package.json` keys used by the loader:

* `name`, `version`, `description`, `author`
* `main` (optional). If missing, the app tries `index.js`, `index.ts`, `index.tsx`, then `dist/index.*`.
* `tahti.displayName` (optional UI name)
* `tahti.categories` (shown in the Plugins list)
* `tahti.icon` and `tahti.permissions` (optional; unknown permissions get a warning)

{% hint style="info" %}
`nuclear` is still read as a legacy alias for `tahti` (with the same shape), for plugins published before the Tahti rebrand. Use `tahti` for anything new.
{% endhint %}
