# Audio editor screenshot with a real waveform

**Status:** open

Logged 2026-09-25 from a user request: load a short WAV (about 30 seconds) into the audio editor and capture the view with the waveform loaded, so the screenshot shows off the detailed waveform rendering instead of an empty or placeholder editor.

## Notes

- Existing captures of the editor: `capture-map-screens.mjs` shots `archive-item-editor` (`/studio/sounds/arch-mock-1/editor`), `editor` (`/studio/editor`) and `editor-track` (`/studio/editor/arch-mock-1`), plus `studio-editor-v1.png` in `capture-tahti-dark-refresh.mjs`. In mock mode these have no real audio decoded.
- The artist journey (`scripts/journeys/artist-journey.mjs`) already does a real file upload through `input[type=file]`; reuse that approach to load the WAV.
- Source audio: the user's `~/Music` folder has about 4,500 WAVs (e.g. `~/Music/Tracks/Albums/Yaniho - XPRMNT LP - …`, `~/Music/Splice/…`). Prefer the user's own tracks (Yaniho, Splice projects) over third-party releases, and cut a ~30 s excerpt with clear dynamics at capture time into a temp file. Never commit the audio to the repo; only the screenshots.

## Plan

- [ ] Pick a track from `~/Music` (confirm the choice with the user) and cut a ~30 s excerpt with varied dynamics (e.g. `afconvert`/`ffmpeg` to a temp path).
- [ ] Add a capture step that loads it into the audio editor, waits for the waveform to finish rendering, and screenshots the editor (Spotify theme, dark and light, admin user, no notifications, via `scripts/lib/captureSetup.mjs`).
- [ ] Use the result in the atlas (`archive-item-editor` / `editor-track`) and the README where the editor appears.
