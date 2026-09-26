# track-visualizer-video-editor.md

**Status:** open

## What

A full-screen editor in tahti-web where a user makes an audio-reactive visualization video for one of their tracks. It builds on [PulseForge](https://github.com/TheAwaken1/PulseForge) and brings its features into Tahti.

Added to the roadmap 2026-09-26 at the user's request. Nothing is built or designed yet.

## What PulseForge brings (from its README, 2026-09-26)

- Stack: React + TypeScript, Vite, Zustand, PixiJS 8 / WebGL, Web Audio API with a custom FFT, Transformers.js Whisper, Tauri 2, and a Pinokio launcher. This lines up closely with tahti-web and the Tauri desktop app.
- Quick "Brand Visualizer" flow: background, logo and track, then a preview.
- Advanced layer editor: background, logo, spectra, particles, shaders, text, lyrics and spectrogram layers. Effects include bloom, colour grade, beat pixelate, glow, pulse, shake, chromatic aberration and vignette. Reactions can target the full mix, bass, mids, highs or detected beats.
- Lyrics: `.lrc` import, auto-timed `.txt`, Whisper alignment or transcription (local, or the OpenAI API).
- Deterministic, frame-perfect MP4 export (720p to 4K) from offline audio analysis.
- The project format is a JSON document: resolution, fps, assets by reference, an ordered layer stack, effects and audio. The README calls this JSON its only stable integration surface. There's no HTTP API.

## Open questions (decide before building)

- **Licence:** the README says MIT, but GitHub's API detects no licence file. Confirm before copying any code; ask the author to add `LICENSE` if needed.
- **Port vs vendor vs fork:** port the renderer and layers into a `@tahti-player/*` package, or vendor/fork it as-is? tahti-web UI rules still apply: chrome must use `@tahti-player/ui` components with Storybook stories.
- **Export path in the browser:** PulseForge writes MP4s through its local server into `output/`. For tahti-web, the options are WebCodecs + an MP4 muxer, ffmpeg.wasm, or a native (Tauri) path on desktop. Server-side rendering on the worker is a further option, with a cost and queue impact.
- **Where videos go:** download only, or upload to MinIO and attach to the track/release (would need `../tahti-org` API and schema changes; don't invent the shapes - inspect first).
- **Whisper:** is local Transformers.js Whisper acceptable (model download size, WebGPU availability)? The OpenAI API option needs a key and a privacy decision.
- **Entry point:** likely an action on the Studio sound page next to the existing editor routes (`/studio/sounds/$id/editor`, `/studio/editor`). Needs a design call.

## Plan (draft)

- [ ] Resolve the licence and the port/vendor decision.
- [ ] Spike: render one PulseForge-style layer stack with PixiJS from a Tahti track (stream URL through Web Audio), full screen, with play/pause.
- [ ] Spike: deterministic export of a 30s clip at 1080p in the browser (WebCodecs), and measure time and memory.
- [ ] Editor UI: full-screen shell, layer list, per-layer properties and presets, all from `@tahti-player/ui` with stories.
- [ ] Save and load projects (PulseForge-compatible JSON), stored locally at first.
- [ ] Lyrics layer and Whisper alignment (optional phase).
- [ ] Upload the finished video and attach it to the track (needs a `../tahti-org` API change and the user's go-ahead).

## Related

- The existing player visualizers live in `packages/tahti-web/src/components/ChannelVisualizer.tsx` and `AudioEngine.tsx`.
- [`audio-editor-waveform-screenshot.md`](audio-editor-waveform-screenshot.md) covers the audio editor, which is a separate feature.
