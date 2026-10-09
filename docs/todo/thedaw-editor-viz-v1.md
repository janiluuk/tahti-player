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
- MIDI / piano-roll clips (spessasynth) — also slice 8 in `next-twenty-slices.md`
- ~~Bounce → version upload~~ — client bounce → sound versions prepare/complete (#613)
- PulseForge video export editor (separate todo)
- Bidirectional package sync back into theDAW
- Artist-creative next steps: [`next-twenty-slices.md`](next-twenty-slices.md)
