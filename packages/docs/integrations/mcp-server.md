---
description: Let AI agents control Tahti Player via the Model Context Protocol.
---

# MCP server

The Tahti Player desktop app includes an [MCP](https://modelcontextprotocol.io/) server, so an AI tool can control playback, the queue, your desktop library and radio, and search Tahti.

## Enable the server

1. Open Tahti Player → Settings → Integrations.
2. Turn on **MCP server**.
3. The server starts on `http://127.0.0.1:8800/mcp`. If port 8800 is taken, it tries 8801, 8802, and so on up to 8809. The row shows the actual URL with a copy button.

The server only answers requests from this computer: it refuses any request whose `Host`, or `Origin` when one is sent, is not `127.0.0.1`, `localhost` or `[::1]`. The switch is remembered, so the server starts again with the app.

## Connect your AI tool

The server URL is `http://127.0.0.1:8800/mcp` using the `Streamable HTTP` transport.

{% tabs %}
{% tab title="Claude Code" %}
```bash
claude mcp add tahti --transport http http://127.0.0.1:8800/mcp
```
{% endtab %}

{% tab title="OpenCode" %}
Add to your `opencode.json`:

```json
{
  "mcp": {
    "tahti": {
      "type": "remote",
      "url": "http://127.0.0.1:8800/mcp"
    }
  }
}
```
{% endtab %}

{% tab title="Codex CLI" %}
Add to `~/.codex/config.toml`:

```toml
[mcp_servers.tahti]
url = "http://127.0.0.1:8800/mcp"
```

Or via the CLI:

```bash
codex mcp add tahti --url http://127.0.0.1:8800/mcp
```
{% endtab %}

{% tab title="Claude Desktop / Cursor / Windsurf" %}
Add to your MCP config (`claude_desktop_config.json`, `.cursor/mcp.json`, etc.):

```json
{
  "mcpServers": {
    "tahti": {
      "url": "http://127.0.0.1:8800/mcp"
    }
  }
}
```
{% endtab %}

{% tab title="MCP Inspector" %}
```bash
npx @modelcontextprotocol/inspector
```

Enter `http://127.0.0.1:8800/mcp` as the URL and select `Streamable HTTP` as the transport.
{% endtab %}
{% endtabs %}

## Tools

Tahti Player exposes four MCP tools. Start broad, drill down, then act.

### `list_methods`

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| `domain`  | string | no       | Leave it out to list the domains. Give one (`Playback`, `Queue`, `Library`, `Radio`, `Tahti`) to list its methods. |

### `method_details`

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| `method`  | string | yes      | `Domain.method`, e.g. `Library.play`. Returns the description, each parameter's type (allowed values for a choice) and whether it is optional, and the return type. |

### `describe_type`

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| `type`    | string | yes      | A type named in a return type, e.g. `PlaybackState`, `QueueItem`, `LibraryTrack`. |

### `call`

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| `method`  | string | yes      | `Domain.method`, e.g. `Playback.toggle`. |
| `params`  | object | no       | Named arguments. Omit or pass `{}` for methods without parameters. Unknown or mistyped arguments are refused with a message that says what was expected. |

## Domains

| Domain | What it does |
| ------ | ------------ |
| `Playback` | `getState`, `play`, `pause`, `toggle`, `next`, `previous`, `seekTo`, `setVolume` (0 to 1), `setMuted`, `setShuffle`, `setRepeatMode` |
| `Queue` | `get`, `playItem`, `remove`, `move`, `clear` |
| `Library` | The desktop library: `search`, `totals`, `play` (by track id), `playlists`, `playPlaylist` |
| `Radio` | `stations` (the built-in stations), `search` (the radio-browser.info directory), `play` |
| `Tahti` | `search` the Tahti catalog, `playArtist` |

Methods that start playback take an optional `mode`: `now` (default) replaces what is playing, `next` inserts after the current item, `end` appends to the queue.

## Example

1. `list_methods` with no arguments lists the five domains.
2. `call` `Library.search` with `{ "query": "aurora" }` returns matching tracks and their ids.
3. `call` `Library.play` with `{ "ids": ["…"], "mode": "next" }` queues them after the current track.
4. `call` `Playback.getState` confirms what is playing.

## Agent skill

If your AI tool supports skills (like Claude Code), install the one that teaches it these tools and the workflow above.

[Download tahti-mcp.zip](../.gitbook/assets/tahti-mcp.zip)

Unzip it into your skills directory (e.g. `~/.claude/skills/`).
