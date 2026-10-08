# Track visualizer video editor (PulseForge → Studio Channel & Design)

**Status:** partial

## Goal

Ship a Studio **Visualization Editor** where an artist picks one of their
tracks, tunes a visualization (reusing Tahti’s existing visualizer presets /
settings / selectors), previews it full-screen, **exports MP4**, and applies
that file as the channel **background video** (`videoBackgroundUrl`) — the same
path Backdrop / Player video already uses.

Placement: **Studio → Channel & Design** (Channel Designer / Settings → Artist
→ Branding / Channel Designer — not a disconnected orphan route). Prefer a
takeover surface from Designer (like maximized Pro Editor) so ordinary chrome
rules still hold for the parent page.

Upstream inspiration: [PulseForge](https://github.com/TheAwaken1/PulseForge)
(PixiJS layers, beat-reactive effects, lyrics, deterministic MP4). Added to
the roadmap 2026-09-26; licence / port findings 2026-09-27 below. Nothing
product-facing is built yet.

## Product loop (must ship end-to-end)

```
Library track → pick preset + tune (shared selectors) → live preview
  → export MP4 → upload / attach → use as Designer background video
  → public channel / artist page plays that backdrop
```

Secondary (later): attach export to the track/release artwork surface; browse
prior exports; lyrics layer / Whisper.

## Where it lives in the app

| Surface | Role |
| --- | --- |
| Channel Designer → Player → Visualizer | Existing preset chrome (`PlayerVisualizerControls`, picker dialog, `TuningSliders`, audio-reactive toggle). **Reuse these**, do not invent a second preset system. |
| Channel Designer → Backdrop / Video or image | Existing `VideoOrImageField` + `videoBackgroundUrl` upload. Export CTA: “Use as background video”. |
| Settings → Add-ons / Themes visualizers | `ThemesCategory` / `VISUAL_PRESETS` + `visualSettingsJson` — keep settings schema in sync with Designer and the editor. |
| Studio Branding / `/studio/branding` | Same `ChannelDesigner` host; entry CTA visible when editing Look. |
| Public channel / artist | Already consume `videoBackgroundUrl` + live `ChannelVisualizer`; exported MP4 is the static/video backdrop option. |

**Entry points (phase 1):**

1. Channel Designer — Visualizer section: **Open visualization editor** (takeover).
2. Optional deep link: `/studio/channel?tab=design&vizEditor=1` or
   `/studio/sounds/$id/visualizer` that opens the same shell with the track
   preselected (sounds route only if it stays one editor, not a fork).

## Integration with existing visualization settings & selectors

Do **not** fork preset IDs or tuning keys.

- Read/write the same `VisualPreset` enum and `VisualSettingsMap` /
  `visualSettingsJson` as `useChannelLook` / `buildVisualPatch` /
  `parseVisualSettingsMap`.
- Mount **the same** UI building blocks:
  - `PlayerVisualizerControls` (prev/next, picker, enable, settings dock)
  - Visualizer picker dialog pattern from `ChannelDesigner`
  - `TuningSliders` (speed / intensity / scale / audioReactive)
  - `ChannelVisualizer` (or a shared preview host that feeds the analyser)
- Brand / color scheme: reuse Designer color-scheme fields when the export
  should match the Look (optional toggle: “Match channel Look”).
- When the user finishes export → hand a `File` into the existing pending
  backdrop video path (`usePendingBackdropFile` / upload that already sets
  `videoBackgroundUrl`), or call the same upload helper Designer uses today.
- Background **live** visualizer vs **baked** MP4: Designer must make the
  choice explicit (header style video vs visualizer). Applying an export sets
  video backdrop and should not silently leave a conflicting live preset
  expectation — follow existing header-style rules in `ChannelPageBackdrop`.

PulseForge layers are an **advanced** mode on top of (or beside) the Tahti
preset stack — phase them so the v1 path is “Tahti preset → MP4” without
requiring Pixi layer literacy.

## UI / component rules

- Storybook-first: look up `packages/storybook/src/tahti-web/` +
  `STORYBOOK-SURFACES.md` before hand-rolling chrome.
- All new chrome from `@tahti-player/ui` (Button, Dialog, FilePicker,
  PluginItem, Slider, Select, ViewShell / PlayerWorkspace patterns, etc.).
- Takeover may hide sidebar/bottom chrome (same class as full-screen player /
  maximized Pro Editor). Parent Channel Designer visit keeps persistent chrome.
- No PulseForge CSS / LayersPanel / Pinokio shell.

## Storybook (required)

Add surfaces + rows in `STORYBOOK-SURFACES.md` / `docs/VIEW-CATALOG.md` when
routes or stories land.

| Story | Covers |
| --- | --- |
| `Tahti/Studio/VisualizerEditor` (shell) | Takeover layout, track header, transport |
| `…/TrackPicker` | Pick from library sounds (empty / loading / list) |
| `…/PresetBar` | Wrapper around shared controls or documented composition with `PlayerVisualizerControls` |
| `…/ExportPanel` | Resolution, fps, progress, cancel, error |
| `…/ApplyAsBackground` | Success → “Use as channel background” |
| Update `ChannelDesignerPlayerVisualizer` | Entry CTA + apply-export state |
| Update `ChannelDesignerVideoOrImageField` / Backdrop | “Generated viz” pending file state |

Flag `Missing states:` for empty library, export failure, unsupported codec.

## Screenshots / atlas (required)

Affected views must get refreshed captures when the UI ships (atlas + any
e2e screenshot paths referenced from `mapScreens.ts`):

- Studio Branding / Channel Designer (Visualizer + Backdrop tabs with new CTAs)
- Visualization Editor takeover (idle, previewing, exporting, done)
- Public channel page with **video** backdrop from an exported viz (mock or seed)
- Settings → Artist Branding if it shares the panel

Also update `mapScreens` “you can do” lines for Designer (open viz editor,
export MP4, apply as background). Keep `storybook-parity-and-atlas-refresh.md`
in mind — Designer parity is already called out there; this feature adds
stories that that leaf should eventually cover.

CI note: Vitest DOM snapshot digest ≠ Storybook screenshots
(`docs/agent/TESTING.md`). Update both if component snapshots change; atlas
PNGs under the map / capture scripts when those views change.

## Architecture (recommended)

| Piece | Approach |
| --- | --- |
| Package | New `@tahti-player/visualizer-studio` — **logic only** (audio offline analysis, renderer, project JSON, export). MIT headers if PulseForge code is ported. |
| UI | `packages/tahti-web` editor route/shell using `@tahti-player/ui` + shared Designer controls. |
| Preview | Web Audio + existing analyser patterns from `AudioEngine` / channel visualizer; prefer one WebGL context. |
| v1 renderer | **Tahti Three.js presets** rendered offscreen / canvas for export (lowest product risk, already matches channel). |
| Advanced renderer | Port PulseForge Pixi `layers/` + `effects/` + `audio/` (lazy chunk; Pixi only loads with the editor). |
| Export desktop | Tauri `ffmpeg` frame pipe (PulseForge pattern); ffmpeg found or bundled — decide in spike. |
| Export web | WebCodecs + MP4 muxer; `MediaRecorder` fallback (non-deterministic). |
| Persist project | PulseForge-compatible JSON in local storage / IndexedDB first; cloud later. |
| Upload | Existing channel gallery / backdrop upload; **no invented DTOs**. If track-level attach needs API, inspect `../tahti-org` first and gate behind user go-ahead. |

## Licence and port/vendor findings (2026-09-27)

Checked with the GitHub API; no code was copied.

- **Licence:** README says MIT, but there is still no `LICENSE` file; GitHub
  reports none. Ask @TheAwakenOne619 to add `LICENSE` (or confirm MIT in a
  linkable issue) before copying. Record notices in `THIRD_PARTY_NOTICES`.
- **Port, don’t vendor:** reuse `audio/`, `layers/`, `effects/`, `renderer/`,
  `project/`; rebuild UI. Export: desktop ffmpeg pipe; web WebCodecs.
- **Deps:** `pixi.js` 8 only if advanced mode ships (lazy). Whisper /
  Transformers.js deferred.

**v1 can ship without copying PulseForge** by exporting Tahti’s existing
Three.js visualizers — unblocks Channel & Design integration and the
background-video loop while licence / Pixi port is open.

## Work plan (phases)

### Phase 0 — Decisions (blocked until answered)

- [ ] Confirm MIT (`LICENSE` on PulseForge or written confirmation).
- [ ] Accept v1 = Tahti Three.js export first; PulseForge layers = Phase 3+.
- [ ] Accept Pixi alongside three in a lazy editor chunk (if Phase 3).
- [ ] Export target: channel backdrop only for v1 vs also track/release attach
      (API inspect in `../tahti-org` if attach).

### Phase 1 — Entry + shared selectors (Channel & Design)

- [x] Add **Open visualization editor** on Designer Player → Visualizer
      (and Branding host). Takeover shell; persistent chrome on parent.
- [x] Wire editor to current Look: preset + `visualSettings` from
      `useChannelLook` (or equivalent props); changes can optionally write
      back to the Look draft.
- [x] Track picker: artist library sounds (stream URL / local blob); empty /
      error states.
- [x] Live preview: selected track drives analyser → `ChannelVisualizer`
      (or shared preview) with current tuning.
- [x] Storybook: shell + track picker + preset bar composition; update
      `ChannelDesignerPlayerVisualizer` story with CTA.
- [x] Tests: track filter helpers, track picker, editor CTA on
      `PlayerVisualizerControls` (Designer parent keeps chrome mounted;
      editor is a z-70 takeover overlay).

### Phase 2 — Export MP4 + apply as background video

- [x] Spike: MediaRecorder + scaled offscreen canvas (WebCodecs deferred);
      bitrate/duration kept under the 10 MB header upload cap.
- [x] Export panel: quality (480/720), duration (5/10/15s), progress, cancel.
- [ ] Desktop (optional): Tauri ffmpeg frame pipe.
- [x] On success: produce `File` (webm/mp4 per browser) →
      `selectVideoFile` + `headerStyle: VIDEO_LOOP` (pending until Save look).
- [x] Designer Player → Video/image tab selected after apply; pending file
      shown via existing `VideoOrImageField`.
- [ ] Public channel smoke after save (manual / later e2e).
- [x] Storybook: ExportPanel states + VideoOrImageField pending generated clip.
- [x] mapScreens Branding actions updated; full atlas PNG refresh deferred
      until UI freeze / capture pass.

### Phase 3 — PulseForge port (advanced editor)

- [ ] Licence cleared → port modules into `@tahti-player/visualizer-studio`.
- [ ] Layer stack UI from `@tahti-player/ui` (reorder, visibility, per-layer
      props); stories for each new control.
- [ ] Keep project JSON compatible with PulseForge where practical.
- [ ] Effects / beat bands; still export through Phase 2 pipeline.
- [ ] Screenshot pass for advanced editor views.

### Phase 4 — Lyrics / Whisper / cloud projects (later)

- [ ] `.lrc` / timed text; Whisper optional and kill-switched.
- [ ] Cloud save / track attach via real `../tahti-org` contracts only.

## Docs / tracker updates when implementing

- Keep this file as the living plan; set `partial` when Phase 1 lands.
- INDEX one-liner stays in sync.
- WORKPLAN epic row until the epic’s last leaf ships.
- `STORYBOOK-SURFACES.md`, `VIEW-CATALOG.md`, `NAVIGATION-SITEMAP.md` when
  the route/entry ships.
- Append UI-REDESIGN-WORKLOG when a slice ships (not for planning).

## Related

- Existing visualizers: `packages/tahti-web/src/components/ChannelVisualizer.tsx`,
  `plugins/visualizers/`, `channel-designer/PlayerVisualizerControls.tsx`,
  `TuningSliders.tsx`, `VideoOrImageField.tsx`, `useChannelLook.ts`.
- Designer host: `ChannelDesigner.tsx`, `StudioBrandingView.tsx`, Settings →
  Artist Branding.
- Atlas / screenshots: `src/content/mapScreens.ts` (Studio Branding, Channel
  Designer); capture scripts / `storybook-parity-and-atlas-refresh.md`.
- Separate: audio waveform editor (`audio-editor-waveform-screenshot.md` if
  present) — do not conflate.
- PulseForge upstream: https://github.com/TheAwaken1/PulseForge
