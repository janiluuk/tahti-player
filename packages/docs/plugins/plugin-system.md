---
description: How do plugins work in Tahti Player?
---

# Plugins

{% hint style="warning" %}
**Legacy: Nuclear plugin SDK.** This page describes the plugin SDK Tahti Player inherited from Nuclear. Since 2026-09 the Tahti Player app — desktop and web — no longer loads these plugins, so nothing on this page runs in the current app. To extend Tahti, see [Tahti add-on and plugin authoring](tahti-web-authoring.md).
{% endhint %}

Plugins are a way to extend what Tahti Player can do. Tahti Player itself is intentionally pretty barebones - it's a framework on which plugin developers can build. Plugins are written in Typescript.

## Plugin installation

When you install a plugin, Tahti Player first reads its manifest (`package.json`) to learn about it, then creates a folder in your [appdata](../user-manual/desktop/platform-notes.md#app-data), in `plugins/<pluginName>/<pluginVersion>`. The contents of the plugin are then copied into this folder, and the plugin is loaded from there.

Tahti Player keeps a registry of installed plugins in `plugins.json`. It's used on startup to find the locations of installed plugins. They are then loaded in the order of installation dates.