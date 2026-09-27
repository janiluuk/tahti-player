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

## Licence and port/vendor findings (2026-09-27)

Checked with the GitHub API; no code was copied.

- **Licence:** the README ends with "## License — MIT", but the repo still has no `LICENSE` file and GitHub reports no licence. There are 11 commits: 10 by the Pinokio account and 1 by "gepeto" (an agent), so the copyright holder is the README's author (@TheAwakenOne619). MIT code can go into this AGPL-3.0-only repo if its copyright and permission notice is kept. **Before copying anything,** ask the author to add a `LICENSE` file (or confirm MIT in an issue we can link), and record the notice in a `THIRD_PARTY_NOTICES` entry plus a header on each ported file.
- **What the code is:** `app/` is a Vite + React 18 + Zustand + PixiJS 8 app with a Tauri 2 shell (about 620 KB of TypeScript). The parts worth reusing are self-contained modules: `audio/` (RealtimeAnalyzer, OfflineAnalyzer, BeatDetector, log bins, smoothing), `layers/` (14 layer types, 16 GLSL shader presets), `effects/` (10 post effects + registry), `renderer/` (PixiApp, SceneManager, ResourceManager), `project/` (JSON schema and persistence, `PROJECT_FORMAT.md`), `utils/lrc.ts` and `lyricsAlignment.ts`, and a Whisper worker on Transformers.js. The UI (`ui/`, 26 KB `LayersPanel`, inline styles plus a 25 KB `global.css`) doesn't fit tahti-web's rule that UI comes from `@tahti-player/ui`.
- **Export as built:** two paths. Desktop: the Tauri command `start_export` / `write_export_frame` pipes raw RGBA frames into a system `ffmpeg` process (`src-tauri/src/ffmpeg.rs`), which is deterministic and frame-perfect. Browser: `canvas.captureStream()` + `MediaRecorder` in real time (not deterministic), saved through the local dev server's `/api/save-export`. Neither uses WebCodecs.
- **Dependencies it would add to tahti-web:** `pixi.js` 8 (tahti-web renders visuals with `three` today) and `@huggingface/transformers` (only for lyrics transcription).

**Recommendation: port, don't vendor or fork.** Port `audio/`, `layers/`, `effects/`, `renderer/` and `project/` into a new `@tahti-player/visualizer-studio` package (logic only, MIT headers kept), and build the editor UI fresh from `@tahti-player/ui` with stories. A git fork or vendored copy would bring its UI, CSS and Pinokio launcher, and it would drift. Export: port the ffmpeg frame pipe into the player's Rust side for the desktop app (it already bundles Tauri; ffmpeg must be found or bundled). On the web, use WebCodecs + an MP4 muxer, keeping MediaRecorder as a fallback. Keep the PulseForge project JSON compatible so projects move between the two apps. Leave Whisper for a later phase (model download size).

Still the user's call: whether to go ahead once the licence is confirmed, and whether PixiJS alongside three.js is acceptable in tahti-web's bundle (lazy-loaded with the editor route, so it doesn't touch initial JS).

## Plan (draft)

- [ ] Resolve the licence and the port/vendor decision. **2026-09-27:** findings and a port recommendation above; waiting on a `LICENSE` file from the author and the user's go-ahead.
- [ ] Spike: render one PulseForge-style layer stack with PixiJS from a Tahti track (stream URL through Web Audio), full screen, with play/pause.
- [ ] Spike: deterministic export of a 30s clip at 1080p in the browser (WebCodecs), and measure time and memory.
- [ ] Editor UI: full-screen shell, layer list, per-layer properties and presets, all from `@tahti-player/ui` with stories.
- [ ] Save and load projects (PulseForge-compatible JSON), stored locally at first.
- [ ] Lyrics layer and Whisper alignment (optional phase).
- [ ] Upload the finished video and attach it to the track (needs a `../tahti-org` API change and the user's go-ahead).

## Related

- The existing player visualizers live in `packages/tahti-web/src/components/ChannelVisualizer.tsx` and `AudioEngine.tsx`.
- [`audio-editor-waveform-screenshot.md`](audio-editor-waveform-screenshot.md) covers the audio editor, which is a separate feature.
