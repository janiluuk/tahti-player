# theDAW editor/viz UX + API fixlist

Sweep date: 2026-10-08. Scope: MultitrackEditor, audio-rack, VisualizerHost,
StudioProEditorView, ChannelVisualizer, audioCoreBridge vs tahti-org.

## P0 — execute now

1. [x] **Audio graph split** — `getMasterGain()` now matches `getEngineCtx()`;
   Studio Pro multitrack calls `preferInternalEngine()`.
2. [x] **Empty document lie** — Blank `loadProject` keeps `tracks: []`; initial
   store is empty so `EmptyState` can show.
3. [x] **Bounce UX** — Bounce hidden without `onBounce`; alert when mixdown null.

## P1 — execute now

4. [x] **Pro editor mode chrome** — Multitrack hides trim Export/Render/Mastering;
   shows local-bounce guidance + API gap note.
5. [x] **Wire `GET /api/me/sound/:id/editor/stream`** — `fetchEditorStreamBlob()`
   used for multitrack load.
6. [x] **ChannelVisualizer** — `suspended={offscreen || !resolvedAudioReactive}`.
7. [x] **FxChainList a11y** — `role="list"` + `aria-current` on selected row.
8. [x] **Import control a11y** — `<label htmlFor>` + `buttonVariants` when tracks exist.
9. [x] **Storybook Empty** — Reset store + mock `onBounce`.

## B — API / unwired (flag; partial code where cheap)

| Item | Status |
|------|--------|
| `GET/PATCH …/editor/draft`, `POST …/render`, `GET …/source` | Wired in tahti-org + client |
| `GET …/editor/stream` | **Exists in tahti-org, unwired in player** → P1 #5 |
| `POST …/editor/bounce` | **410 removed** — client-only bounce OK |
| `/api/me/editor/projects` | Pro Multitrack find-or-creates + hydrate + debounced metadata PATCH (#613); FX/blobs stay OPFS |
| hearthis `me-tracks` / add / search | Wired; set tracklists may hit hearthis.at from browser |
| Multitrack → server version publish | Bounce → sound versions prepare/complete (#613); download fallback remains |

## C — nice-to-haves (#613)

1. [x] **Track vol/pan Sliders** — `updateTrack` + labelled controls.
2. [x] **Clip drag/split/zoom UI** — store zoom; clip drag `startSec`; split at playhead.
3. [x] **Unify Pro MultitrackEditor with editor-projects API** — find-or-create + hydrate + debounced PATCH.
4. [x] **FullScreenPlayer per-channel viz preset** — localStorage via `channelVizPreset`.
5. [x] **AdvancedVisualizer token restyle** — Tahti tokens.
6. [x] **Multitrack StudioProEditor tests** — adapter, viz preset, StudioProEditorView, stems→lanes.

Further artist-creative work is listed in [`next-twenty-slices.md`](next-twenty-slices.md).
