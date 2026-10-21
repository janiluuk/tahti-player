---
description: Control Tahti Player from a phone, scripts and other tools with Tahti Jam.
---

# Tahti Jam and the HTTP API

Tahti Jam lets you control the Tahti Player desktop app from a phone, tablet or another computer on the same network. It also exposes a small HTTP API you can use from scripts.

Tahti Jam isn't the same as shared listening sessions (`/jam/…` links on tahti.live). Those run through your Tahti account; Tahti Jam only talks to the desktop app on your network.

## Pair a phone

1. In Tahti Player, go to Settings, then Integrations, and turn **Tahti Jam** on.
2. Scan the QR code with your phone, or open the link shown under the switch. It looks like `http://192.168.1.42:4120/remote#token=…`.
3. The remote opens in the phone's browser. The phone remembers it's paired, so next time you can open `http://192.168.1.42:4120/remote` directly.

The server listens on ports 4120–4129, on every network the computer is connected to. Only devices that have the pairing code can control the player.

**New pairing link** makes a new code and restarts the server. Every device paired before has to scan again. Use it if you shared the link with someone who shouldn't keep it.

## What the remote does

- Shows what's playing, with the time and progress.
- Play and pause, skip, go back, seek, shuffle and repeat.
- Shows the queue and removes items from it.
- Searches Tahti and adds tracks to the queue. On an empty queue, the first track added starts playing.

## HTTP API

Every endpoint except `/api/health` needs the pairing code, sent as a bearer token:

```bash
TOKEN=…   # the part after #token= in the pairing link
curl -H "Authorization: Bearer $TOKEN" http://192.168.1.42:4120/api/playback
```

Without it the server answers `401` with `{ "error": "This device isn't paired. …" }`.

### State

| Method | Path | Returns |
|--------|------|---------|
| GET | `/api/health` | `{ "status": "ok" }` (no token needed) |
| GET | `/api/queue` | `{ "items": QueueItem[], "currentIndex": number }` |
| GET | `/api/playback` | `{ "status": "playing" \| "paused" \| "loading" \| "stopped", "seek": number, "duration": number, "volume": number, "muted": boolean }` |
| GET | `/api/settings` | `{ "shuffle": boolean, "repeat": "off" \| "all" \| "one" }` |

Queue items never include file paths or stream URLs, and artwork is only included when it's an image on the web.

### Actions

Action endpoints take a JSON body (send `{}` when there's nothing to send) and return `200 OK` with no body.

| Method | Path | Body | Effect |
|--------|------|------|--------|
| POST | `/api/playback/play` | none | Resume, or start the queue from the top |
| POST | `/api/playback/pause` | none | Pause |
| POST | `/api/playback/toggle` | none | Play or pause |
| POST | `/api/playback/next` | none | Skip to the next track |
| POST | `/api/playback/previous` | none | Go to the previous track |
| POST | `/api/playback/seek` | `{ "seconds": number }` | Seek (ignored on radio and live streams) |
| POST | `/api/playback/volume` | `{ "volume": number }` | Set the volume, 0 to 1 |
| POST | `/api/playback/shuffle` | `{ "enabled": boolean }` | Shuffle on or off |
| POST | `/api/playback/repeat` | `{ "mode": "off" \| "all" \| "one" }` | Set the repeat mode |
| POST | `/api/queue/play` | `{ "id": string }` | Play a queue item |
| POST | `/api/queue/remove` | `{ "ids": string[] }` | Remove queue items |
| POST | `/api/queue/add` | `{ "tracks": Track[] }` | Add tracks returned by `/api/search` |
| POST | `/api/search` | `{ "query": string, "limit"?: number }` | Search Tahti tracks. Returns `{ "tracks": Track[] }`, at most 20 |

`/api/queue/add` only accepts Tahti tracks as `/api/search` returns them.

### Events (SSE)

`GET /api/events` opens a Server-Sent Events stream. Browsers can't add headers to an `EventSource`, so this endpoint also accepts the code as `?token=…`.

```
event: queue
data: {"items":[...],"currentIndex":3}

event: playback
data: {"status":"playing","seek":42.1,"duration":213.0,"volume":0.8,"muted":false}

event: settings
data: {"shuffle":false,"repeat":"off"}
```

Each event carries the full state for its kind. `playback` is sent when the status, duration or volume changes, and at most once a second while a track plays.

## Errors

Failed requests return a JSON body with an `error` field:

```json
{ "error": "mode must be off, all or one." }
```

The status is `401` without a valid pairing code, `500` when the request reached Tahti Player but failed, and the usual HTTP codes otherwise (404 for unknown routes).
