# theDAW → tahti-player port inventory (v1 / 1a+2c)

## Stub points (out of v1)

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

## Must-port clusters

- **Rack:** `rackEffects.ts`, `effectChainStore` ChainEntry types, worklets, EffectWindows built-in path, TheOwl Kaoss (param bridge)
- **Editor:** `editorStore`, `liveMixer`, AutomationLane, SemanticWave, peeled MultitrackEditor, `editorAutosave`
- **Viz:** AdvancedVisualizer, QuantumLattice*, CymaticsVisualizer + shaders, hybrid-source

## Hosts

- `StudioProEditorView` shell + bounce → `renderEditorDraft`
- `AudioEngine` analyser → audio-core
- `ChannelVisualizer` / FullScreenPlayer mode registry
