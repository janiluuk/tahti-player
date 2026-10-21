---
description: Where the desktop app keeps its files, and what it changes on Linux
---

# Platform-specific notes

These notes are about the desktop app. The browser version at [beta.tahti.live](https://beta.tahti.live) does not use these folders.

## App data

The desktop app's identifier is `live.tahti.player`, and its data folder is named after it:

| Platform | Folder |
| -------- | ------ |
| Linux | `~/.local/share/live.tahti.player/` |
| macOS | `~/Library/Application Support/live.tahti.player/` |
| Windows | `%APPDATA%\live.tahti.player\` |

Among other files, it holds:

- `databases/library.db` - the index of your local music library.
- `artwork/` - cover art embedded in your music files, stored once per picture.

## Logs

The desktop app writes a log file and keeps the last seven, each up to 5 MB:

| Platform | Folder |
| -------- | ------ |
| Linux | `~/.local/share/live.tahti.player/logs/` |
| macOS | `~/Library/Logs/live.tahti.player/` |
| Windows | `%LOCALAPPDATA%\live.tahti.player\logs\` |

## Linux

The app sets these environment variables when it starts, unless you have already set them yourself:

| Variable | Value | Why |
| -------- | ----- | --- |
| `WEBKIT_DISABLE_DMABUF_RENDERER` | `1` | Avoids a blank window on NVIDIA and some other GPUs. |
| `WEBKIT_DISABLE_COMPOSITING_MODE` | `1` | Avoids crashes when resizing on NVIDIA and the Steam Deck. |
| `GST_PLUGIN_FEATURE_RANK` | `pipewiresink:NONE` | Sends audio through PulseAudio so the latency settings below apply. |
| `PULSE_LATENCY_MSEC` | `60` | Keeps Bluetooth headphones playing on PipeWire. |
| `PIPEWIRE_LATENCY` | `1024/48000` | Same as above. |

To use a different value, set the variable before you start the app, for example:

```bash
WEBKIT_DISABLE_DMABUF_RENDERER=0 ./Tahti.Player_*_amd64.AppImage
```
