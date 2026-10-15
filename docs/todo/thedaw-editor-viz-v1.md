# theDAW editor + viz port (v1 complete)

**Status:** partial

## Shipped in v1 (1a / 2c)

- Packages: `@tahti-player/audio-core`, `audio-rack`, `audio-editor`, `visualizer`
- Browser Web Audio rack (19 effects) + MultitrackEditor + OPFS autosave
- AdvancedVisualizer + Cymatics modes via `VisualizerHost`
- Host wiring: AudioEngine → audio-core bridge, ChannelVisualizer `engineMode`, FullScreenPlayer spectrum, StudioProEditorView multitrack + viz slot

## Follow-ups

- [.gan sidecar] Owl/Ares as hosted plugins (plan option 1b)
- VST3 freeze + pedalboard host
- FFmpeg Edit Tool Stack / mastering families
- ~~Bounce → version upload~~ — client bounce → sound versions prepare/complete (#613)
- PulseForge video export editor (separate todo)
- Bidirectional package sync back into theDAW
- Artist-creative next steps: [`next-twenty-slices.md`](next-twenty-slices.md)

## Port inventory (what v1 took from theDAW)

Moved here from `docs/port-inventory-thedaw-editor-viz.md`.

### Stub points (out of v1)

| Source import / feature | Action |
| --- | --- |
| `vstStore`, `vstEditorStore`, `vstClient`, `VstEmbedHost` | Omit; no VST freeze UI |
| `ganStore`, `GanPluginStage`, `.gan` runtime | Omit; Owl via native rack only |
| `addBlobsToChimera`, MagentaToolStage, morphEngine | Omit |
| `useGenerateParamsStore`, inpaint, model gates | Omit |
| `StemsRunModal` / Demucs | Omit |
| FFmpeg edit-modules / `/api/studio` tool stack | Omit |
| `pianoRollStore` / spessasynth MIDI clips | Deferred (audio clips only) |
| `libraryStore` / LibraryPicker | Host supplies clips via props/API |
| `playerStore` | Replaced by `@tahti-player/audio-core` |
| `logStore` | Thin local logger or `console` |

### Must-port clusters

- **Rack:** `rackEffects.ts`, `effectChainStore` ChainEntry types, worklets, EffectWindows built-in path, TheOwl Kaoss (param bridge)
- **Editor:** `editorStore`, `liveMixer`, AutomationLane, SemanticWave, peeled MultitrackEditor, `editorAutosave`
- **Viz:** AdvancedVisualizer, QuantumLattice*, CymaticsVisualizer + shaders, hybrid-source

### Hosts

- `StudioProEditorView` shell + bounce → `renderEditorDraft`
- `AudioEngine` analyser → audio-core
- `ChannelVisualizer` / FullScreenPlayer mode registry
