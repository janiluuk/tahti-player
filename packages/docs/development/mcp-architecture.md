---
description: How the desktop MCP server works internally and how to extend it.
---

# MCP architecture

The desktop app's MCP server lets an AI tool control the player. It runs on `127.0.0.1:8800/mcp` (up to 8809 when the port is taken) with the Streamable HTTP transport.

## Pieces

| Piece | Path |
| ----- | ---- |
| Rust server (`rmcp`), the four tools, the loopback check | `packages/player/src-tauri/src/mcp/` |
| Rust ↔ webview bridge | `packages/player/src-tauri/src/bridge/` |
| Desktop wiring: start/stop, answering bridge requests | `packages/player/src/desktopMcp.ts` |
| The API: domains, methods, types, argument checks | `packages/tahti-web/src/lib/mcp/` |
| Settings → Integrations row and its store | `packages/tahti-web/src/components/McpIntegrationRow.tsx`, `src/lib/mcp/desktop.ts` |

## The four tools

Rust defines the tools in `tools.rs`, and all four go over the bridge to the webview:

| Tool | Bridge method |
| ---- | ------------- |
| `list_methods` | `Meta.listMethods` (`{}` lists the domains, `{ domain }` a domain's methods) |
| `method_details` | `Meta.methodDetails` |
| `describe_type` | `Meta.describeType` |
| `call` | the method itself, e.g. `Playback.toggle` (`Meta.*` is refused) |

The API is described once, in `packages/tahti-web/src/lib/mcp/registry.ts`, so discovery always matches what `call` runs. `dispatchMcp` checks every argument against the method's parameters (type, allowed values, unknown names) before running it, and throws `McpUserError` with a message the agent can act on.

## The bridge

1. An agent calls a tool. Rust's `Bridge::call()` stores a `oneshot` sender under a new trace id and emits `bridge:request` `{ traceId, method, params }` to the webview.
2. `desktopMcp.ts` hears the event, runs `dispatchMcp(method, params)` and replies with `commands.bridgeRespond({ traceId, status: 'success', data })` or `{ status: 'error', error }`.
3. Rust matches the trace id and returns the result. After 30 seconds without a reply it gives up.

An error the method returned reaches the agent as tool error content. A broken bridge (timeout, closed channel) is an MCP internal error.

## Lifecycle

`mcp_start` and `mcp_stop` are Tauri commands. `desktopMcp.ts` exposes them to tahti-web as `globalThis.__TAHTI_NATIVE_MCP__`; the Settings row calls them, remembers the switch in `localStorage` (`tahti-desktop-mcp-enabled`), and `initDesktopMcp()` starts the server at launch when it was left on. The web app has no `__TAHTI_NATIVE_MCP__`, so the row there stays a "Desktop app only" note.

## Local requests only

`origin.rs` wraps the router: a request whose `Host` is not `127.0.0.1`, `localhost` or `[::1]`, or whose `Origin` (when sent) is not one of those, gets a 403. That stops a web page from reaching the server through DNS rebinding.

## Adding a method or domain

1. Add the method to a domain file in `packages/tahti-web/src/lib/mcp/` (or a new domain file, registered in `MCP_DOMAINS` in `registry.ts`).
2. Name its return type in `MCP_TYPES`; `registry.test.ts` fails when a return type cannot be described.
3. Update the domain table in `packages/docs/integrations/mcp-server.md` and the agent skill.

No Rust change is needed.
