---
description: Open URLs in the user's system browser from a plugin.
---

# Shell

{% hint style="warning" %}
**Legacy: Nuclear plugin SDK.** This page describes the plugin SDK Tahti Player inherited from Nuclear. Since 2026-09 the Tahti Player app — desktop and web — no longer loads these plugins, so nothing on this page runs in the current app. To extend Tahti, see [Tahti add-on and plugin authoring](tahti-web-authoring.md).
{% endhint %}

## Shell API for plugins

The Shell API lets plugins use select functions to interact with the user's system. It lets you support OAuth flows where the user needs to approve access on an external site.

{% hint style="info" %}
Access the Shell API via `api.Shell.*` in your plugin's lifecycle hooks.
{% endhint %}

---

## Usage

A typical use case is redirecting the user to an external auth page:

```typescript
import type { TahtiPluginAPI } from '@tahti-player/plugin-sdk';

export default {
  async onEnable(api: TahtiPluginAPI) {
    const token = await getAuthToken();
    const authUrl = `https://example.com/auth?token=${token}`;
    await api.Shell.openExternal(authUrl);
  },
};
```

---

## Reference

```typescript
api.Shell.openExternal(url: string): Promise<void>
```

Opens `url` in the user's default system browser. Delegates to Tauri's opener plugin.

### Types

```typescript
type ShellHost = {
  openExternal(url: string): Promise<void>;
};
```
