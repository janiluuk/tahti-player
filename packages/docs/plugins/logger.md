---
description: Structured logging for plugins, routed to Tahti Player's log file and developer console.
---

# Logger

{% hint style="warning" %}
**Legacy: Nuclear plugin SDK.** This page describes the plugin SDK Tahti Player inherited from Nuclear. Since 2026-09 the Tahti Player app — desktop and web — no longer loads these plugins, so nothing on this page runs in the current app. To extend Tahti, see [Tahti add-on and plugin authoring](tahti-web-authoring.md).
{% endhint %}

The Logger API gives plugins structured, leveled logging. All log output is routed through Tahti Player's logging system, which writes to the app's log file and the developer console.

These logs can also be viewed in the built-in log viewer (Preferences → Logs).

---

## Usage

Access the logger via `api.Logger.*` in any lifecycle hook:

```typescript
import type { TahtiPlugin, TahtiPluginAPI } from '@tahti-player/plugin-sdk';

const plugin: TahtiPlugin = {
  onEnable(api: TahtiPluginAPI) {
    api.Logger.info('Plugin enabled');
    api.Logger.debug('Loaded 42 cached entries');
  },

  onDisable(api: TahtiPluginAPI) {
    api.Logger.info('Plugin disabled');
  },
};

export default plugin;
```

{% hint style="info" %}
All Logger methods are synchronous and return `void`. They never throw.
{% endhint %}

---

## Log levels

Levels follow standard severity ordering, from most verbose to most severe: `trace` → `debug` → `info` → `warn` → `error`.

You can also call `api.Logger.log(level, message)` with any `LogLevel` value directly. This is useful when the level is determined at runtime.

---

## Reference

```typescript
type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';

api.Logger.trace(message: string): void
api.Logger.debug(message: string): void
api.Logger.info(message: string): void
api.Logger.warn(message: string): void
api.Logger.error(message: string): void
api.Logger.log(level: LogLevel, message: string): void
```

---

## Notes

* All methods are synchronous. They accept a string and return nothing.
* If no logger host is provided (e.g. during testing), every method no-ops.
* Log output goes to Tahti Player's logging system, which writes to the app's log file on disk devtools console, terminal console, and the built-in log viewer (Preferences → Logs).
