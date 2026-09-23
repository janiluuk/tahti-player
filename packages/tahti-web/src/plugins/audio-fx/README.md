# Audio FX

The Pro Editor's plugin chain (EQ, Compressor, Limiter, Filter) — both the
tile metadata `PluginStorePanel`/`StudioProEditorView` display and the
live Web Audio node-building behind the real-time preview.

## Contract

```ts
interface AudioFxPlugin {
  id: ProEditorPluginId; // 'eq' | 'comp' | 'limiter' | 'filter'
  label: string;
  description: string;
  icon: LucideIcon;
  bg: string; // tile background color
  isEnabled(editList: EditList): boolean;
  buildPreviewNodes(ctx: AudioContext, editList: EditList): AudioNode[];
}
```

`buildPreviewNodes` returns the Web Audio nodes this plugin contributes
to the live preview chain, in the order they should be connected in
series. `src/lib/audioPreviewGraph.ts` (`useAudioPreviewGraph`, the host
hook wired into `StudioProEditorView`'s `<audio>` element) is the only
caller — it loops `editList.pluginChain`, skips disabled plugins, and
connects whatever each enabled plugin returns. It has no per-plugin
branches; it doesn't know EQ from a Limiter.

Note: `buildPreviewNodes` is a real-time _approximation_ for monitoring.
The limiter, for instance, is a fast `DynamicsCompressorNode`, not a true
brickwall limiter — the actual export still renders through the ffmpeg
path server-side. See the comment in `../../lib/audioPreviewGraph.ts`.

## Files

One module per plugin (`eq.ts`, `compressor.ts`, `limiter.ts`,
`filter.ts`), each exporting a single `AudioFxPlugin` const. `index.ts` is
the registry: `audioFxPlugins` (array, chain-add-picker order),
`AUDIO_FX_PLUGINS` (id-keyed map, what most consumers actually want), and
`ALL_PLUGIN_IDS`.

## Testing

Neither vitest's default `node` environment nor `jsdom` implement the Web
Audio API, so each plugin's test builds nodes against a hand-written fake
`AudioContext` (`testAudioContext.ts`) that only stubs the couple of
methods/`AudioParam` shapes these plugins actually call, then asserts on
what got written onto the fake nodes. See any of the four `*.test.ts`
files for the pattern.

## Extending

A fifth plugin (reverb, de-esser, whatever) means: a new module
implementing `AudioFxPlugin`, one line added to `audioFxPlugins` in
`index.ts`, and a test against `testAudioContext.ts`. Nothing in
`useAudioPreviewGraph` or `StudioProEditorView.tsx` needs to change for
the audio-graph half — though the host _UI_ (add/remove/reorder/per-plugin
param controls) is still hand-written per plugin inside
`StudioProEditorView.tsx` (~1200 lines) and would need its own generic
host component before a truly arbitrary/third-party plugin chain is
realistic. See [`../../../PLUGIN-STORE-PLAN.md`](../../../PLUGIN-STORE-PLAN.md)
§2 for that gap.
