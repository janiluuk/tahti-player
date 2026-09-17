# Data flow

One thesis: **the API is the hub.** Every client reads and writes through
it; it's the only thing that talks to Postgres, and it's what hands out the
short-lived credentials (presigned upload URLs, Centrifugo JWTs) that let
clients then talk to storage and chat *directly*, without the API in the
loop for every byte.

```mermaid
flowchart LR
    subgraph Listen
        L1[Browser / tahti-web] -->|GET channel, sound, tracklist| L2[API]
        L2 -->|presigned URL| L3[(MinIO / R2)]
        L1 -.->|stream audio directly| L3
        L1 -.->|direct WS, short-lived JWT| L4[Centrifugo chat]
    end

    subgraph Studio publish
        S1[Studio upload] -->|prepare| S2[API]
        S2 -->|presigned PUT| S3[(MinIO)]
        S1 -.->|upload bytes directly| S3
        S1 -->|complete| S2
        S2 -->|enqueue| S4[(Redis)]
        S4 --> S5[BullMQ worker]
        S5 -->|transcode, peaks, fingerprint ID| S3
        S5 -->|status: PROCESSING -> READY| S6[(Postgres)]
    end

    subgraph Go live
        G1[OBS / RTMP encoder] -->|publish| G2[Ingest host]
        G3[API] -->|spawn per-channel| G4[Orchestrator + Liquidsoap]
        G2 --> G4
        G4 -->|HLS + multistream| G5[CDN]
        L1 -.->|play HLS| G5
    end
```

The same flow in words:

- **Listen** — `tahti-web` asks the API for what to show (channel metadata,
  a sound's tracklist, a release). For anything binary, the API hands back
  a presigned URL instead of the bytes; the browser then streams audio and
  loads images straight from storage. Chat is the same pattern: the API
  signs a short JWT once, and the browser holds an open websocket to
  Centrifugo directly.
- **Studio publish** — an upload is a three-step handshake with the API
  (prepare → direct-to-storage PUT → complete), not a single big POST. The
  API's job on "complete" is just to enqueue work; a BullMQ worker (drained
  off Redis) does the actual transcoding, waveform-peaks generation, and
  audio fingerprinting, writing results back to storage and flipping the
  track's Postgres status from `PROCESSING` to `READY` (or `FAILED`) when
  it's done. Nothing in this path blocks an API request on ffmpeg.
- **Go live** — the API never touches the media stream itself. It only
  tells a separate orchestrator service to spawn a per-channel Liquidsoap
  process, which takes the artist's RTMP/Icecast source and produces the
  HLS (+ multistream) output listeners actually play from the CDN. Chat
  during a live show rides the same direct-to-Centrifugo path as Listen.

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for what each box is (and where
its code lives); this page is only about the shape of the traffic between
them.
