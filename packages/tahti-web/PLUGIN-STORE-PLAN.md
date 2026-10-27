# Plugin store — mapping & extraction plan

`Settings > Plugin store` (`src/components/PluginStorePanel.tsx`) is a unified
**browser** across 7 subsystems that already behave like plugins but live
scattered through the main codebase. It does not change where any of them
run — it's a navigation/launcher layer over the existing implementations.
This doc maps where each one lives today and what actually extracting it
into a standalone, removable plugin would take.

See [`docs/PLUGINS.md`](docs/PLUGINS.md) for the contract the three
extractions below follow, and the pattern to use for the remaining four.

Ranked by extraction cost (cheapest first):

## 1. Themes — DONE

- **Lives**: `src/plugins/themes/store.ts` (moved from `src/stores/themeStore.ts`
  unchanged — same public interface). `listBasicThemes()` comes from
  `@tahti-player/themes`; custom themes are user-imported JSON in
  `customThemes: Record<string, AdvancedTheme>`.
- **Settings today**: `ThemesPanel` in `SettingsPanels.tsx`. The old
  `src/views/ThemesView.tsx` was found to be dead code (nothing routed to
  it — a stale duplicate of `ThemesPanel` missing the custom-theme
  import/remove UI) and deleted rather than moved.
- **Extraction done**: relocated to `src/plugins/themes/`, all 6 call
  sites updated to the new import path. No behavior change.

## 2. Audio plugins (Pro Editor chain) — registry done, host UI still open

- **Lives**: `src/plugins/audio-fx/` — `AudioFxPlugin` interface
  (`isEnabled`/`buildPreviewNodes`) plus one module per plugin (`eq.ts`,
  `compressor.ts`, `limiter.ts`, `filter.ts`), each with its own unit test
  against a fake `AudioContext` (`testAudioContext.ts` — vitest's node/jsdom
  environments don't implement real Web Audio).
  `src/lib/audioPreviewGraph.ts` (the live-preview host hook) now just
  loops `editList.pluginChain` and asks each enabled plugin to build its
  own nodes, instead of a hardcoded if/else per plugin id.
- **Settings today**: `src/views/studio/StudioProEditorView.tsx`
  (still ~1200 lines) — the plugin-chain UI (add/remove/reorder +
  per-plugin params) lives inside this one large view, not a separate
  settings page. Untouched by this extraction beyond swapping its
  `PLUGIN_META`/`ALL_PLUGIN_IDS` imports to the new registry.
- **Done**: the registry + preview-graph dispatch. A new plugin is a new
  module implementing `AudioFxPlugin` plus one line in
  `src/plugins/audio-fx/index.ts` — no changes to
  `useAudioPreviewGraph` or `StudioProEditorView.tsx` needed for the
  audio-graph half.
- **Still open**: the *host UI* — add/remove/reorder/per-plugin param
  controls — is still welded into `StudioProEditorView.tsx`. A real
  "audio plugin store" (arbitrary third-party plugin tiles, not just
  these four) still needs a generic plugin-chain host component factored
  out of that view first; extracting the registry didn't shrink the file
  and wasn't meant to.

## 3. Multicast (RTMP targets) — DONE

- **Lives**: `src/api/broadcast.ts` (578 lines) — `RtmpTarget` CRUD — plus
  `src/plugins/multicast/` (`MulticastProvider`/`MulticastProviderId`
  type + a typed registry of the 8 providers the API actually supports).
- **Settings today**: `StudioGoLiveView.tsx` (multistream section) and
  `StreamManagerPanel.tsx` (read-only target list) both source their
  provider dropdown/display labels from the registry. A **third** copy
  was found while typing `RtmpTarget.provider` — `ConnectionsPanel` in
  `SettingsPanels.tsx` (Settings → Broadcast → Multistream) had its own
  free-text "Provider" `<Input>` (real UX debt: typos would create
  untyped garbage on the wire) and the exact same raw-`t.provider`
  display bug the other two already had fixed. Both fixed: the free-text
  input is now a `Select` sourced from `multicastProviders`, and its
  three raw-`provider` display sites (`name`, `author`, toggle
  `aria-label`) all route through `multicastProviderLabel`.
- **Done**: the registry, built from `PROVIDER_RTMP_URLS` in
  `tahti-org/apps/api/src/routes/me/rtmp-targets.ts` (the real source of
  truth) rather than guessed — which caught a real drift bug: the
  frontend dropdown only offered YOUTUBE/TWITCH/KICK/FACEBOOK/CUSTOM
  while the API has supported TIKTOK, MIXCLOUD_LIVE, and INSTAGRAM with
  no way to pick them in the UI. `RtmpTarget.provider` (and
  `createRtmpTarget`'s `provider` input) are now typed
  `MulticastProviderId`, not a plain `string` — a typo in any of the
  three consumers is now a compile error, not a silent untyped value on
  the wire. Verified live: new e2e coverage for all three UIs (Go Live
  dialog, Settings Broadcast panel, StreamManagerPanel display).
- **Still open**: `StudioGoLiveView`'s add-destination form and
  `SettingsPanels.tsx`'s `ConnectionsPanel` are still two separate
  components each with their own add-destination form — de-duplicating
  those into one shared host component is real UI work, not a type/data
  fix, and wasn't attempted here.

## 4. Export — relocated, still not a behavioral plugin

- **Lives**: `src/plugins/export/` — `EXPORT_TARGETS`, 10 entries, each
  still just `{id, label, note, color, to, supportsTracks}`. Real delivery
  logic is centralized in `StudioDistributionView.tsx` (Revelator
  submission), not per-target.
- **Settings today**: `ConnectionsPanel` in `SettingsPanels.tsx`,
  `TrackExportPanel.tsx`, `PluginStorePanel.tsx` + `StudioDistributionView.tsx`.
- **Done this pass**: moved to `src/plugins/export/` (same shape as
  multicast's registry — see `docs/PLUGINS.md`'s shape A), all 3
  importers updated, one test file covering the registry invariants
  (unique ids, every Revelator-note target actually points at
  `/studio/distribution`).
- **Still not plugin-shaped, deliberately not faked**: this remains a
  flat metadata array with a deep-link, not independent implementations —
  every DSP still goes through the same one Revelator call regardless of
  which box is checked. A real `ExportProvider` interface
  (submit/status/webhook) needs API work that doesn't exist yet; writing
  one against nothing to implement it would just be an unused interface,
  so this extraction stopped at relocation rather than inventing one.

## 5. Import (Sources) — OAuth / search / tool adapters done

HTTP still lives in `src/api/sources.ts`. Kind-specific behavior is on
`src/plugins/import-sources/` (`oauth.ts`, `search.ts`, `tool.ts`).
`PluginStorePanel` (the Add-ons host that replaced `SourcesView`) and
`StudioUploadView` call adapters, not raw connect/search/import helpers.
Sibling `GET /api/me/import-plugins` lists the same catalog. A universal
`start/status/import` interface was not added.

The original extraction notes below are kept for history.

- **Lives**: `src/api/sources.ts` still owns `SOURCE_DEFS` plus every source's
  OAuth-flow/search/import-job HTTP (SoundCloud track listing, Spotify search,
  hearthis search+import, Google Drive import jobs, Bandcamp album import,
  ...) because they share this file's private `requestJson`/mock-fallback
  plumbing. Adapters wrap those functions per kind.
- **Settings today**: `PluginStorePanel` Import cards and Studio Upload
  widgets route through `oauthAdapterFor` / `spotifySourceAdapter` /
  `hearthisSourceAdapter` / `toolSourceAdapter`.
- **Already plugin-shaped**: three adapter contracts, not one fake
  start/status/import shape.

## 6. Fingerprinting — DONE (interface only, still one provider)

- **Lives**: `src/plugins/fingerprinting/` — `FingerprintProvider`
  interface (`match`/`check`) plus `acoustIdProvider`, which wraps the
  existing `runTrackFingerprint`/`refingerprintTrack`/`checkTrackFingerprint`
  calls in `src/api/studio.ts` (left in place — they share that file's
  `requestJson`/mock-fallback plumbing with the rest of the studio API
  surface, not worth pulling out on their own).
- **Settings today**: none — `FingerprintTrackPanel.tsx` (117 lines) is a
  per-track action widget on `StudioReleaseDetailView.tsx`, not a Settings
  surface, and now calls `acoustIdProvider.match`/`.check` instead of the
  raw functions. `PluginStorePanel`'s fingerprinting tab is the first place
  this is browsable at all.
- **Extraction done**: the interface exists now, so a second provider is a
  sibling module implementing it, not a branch inside `runTrackFingerprint`.
  Still only one provider (`acoustIdProvider`) — that was true before this
  pass too, nothing user-facing changed.

## 7. Visualizers — DONE

- **Lives**: `src/plugins/visualizers/` — a `VisualizerPreset` interface
  (`id`, `description`, `build(scene, scheme, artworkUrl?): PresetScene`)
  plus one module per preset under `presets/` (`waterRipple.ts`,
  `waveformBars.ts`, `particleField.ts`, `aurora.ts` — also the
  fallback for an unrecognized id — `reactiveGrid.ts`, `cloudscape.ts`,
  `lineTangle.ts`, `backdropBox.ts`, `lensFlares.ts`, `iesSpotlight.ts`),
  a `shared.ts` for the couple of things multiple presets genuinely reuse
  (a glow-sprite texture generator, the `TAU` constant), and one test per
  module. `src/components/visuals/ThreeVisualizer.tsx` shrank from 567 to
  ~150 lines — it's now just the WebGL host (renderer/camera/scene
  bootstrap, the render loop, disposal) and calls `visualizerPreset(preset)
  .build(...)` instead of a 10-case switch with every preset's Three.js
  code inline. `MINIMAL` (a real, selectable preset with **no** Three.js
  scene) deliberately has no registry entry — see the interface's doc
  comment and `ChannelVisualizer.tsx`, which never mounts `ThreeVisualizer`
  for it at all.
- **This was less risky than it looked.** The original assessment below
  (kept for the record) expected a "genuine refactor" needing real
  redesign. In practice every `create*` scene-builder in the old
  `ThreeVisualizer.tsx` was already a pure, self-contained function taking
  `(scene, scheme, artworkUrl?)` and returning an `update(elapsed, level)`
  closure — the switch dispatching to them was the only actually-coupled
  part. The extraction was close to mechanical: move each function to its
  own file, name the shape `VisualizerPreset`, replace the switch with a
  `Map` lookup. Verified live (not just unit tests) — `pnpm dev` +
  Playwright against `/radio`: canvas renders, correct preset attribute,
  zero console errors.
- **Settings today**: `ChannelDesigner.tsx`'s "Visualizer" tab still has
  its own `PRESET_META` (description + `LucideIcon` per preset) — a
  **third** copy of visualizer descriptions, with wording that diverges
  from both the old `ThreeVisualizer` comments and `PluginStorePanel`'s
  copy (e.g. `WATER_RIPPLE`: "Soft ripple distortion synced to audio
  level." here vs. "Concentric ripples reacting to the beat." in the
  registry). Found, not merged — unifying copy across three surfaces is a
  content decision, not a refactor call to make silently; flagged as a
  follow-up rather than picking a winner unasked. The per-preset icon
  (`Droplets`, `AudioLines`, `Sparkles`, ...) is real, reusable metadata
  that belongs in `VisualizerPreset` alongside `description` whenever that
  consolidation happens.

## Suggested order

1. **Now** — done: `PluginStorePanel` browses all 7 via existing data,
   no main-codebase changes.
2. **Quick wins** (each independent, no dependency on the others):
   - DONE — `themeStore` extracted to `src/plugins/themes/` (§1), dead
     `ThemesView.tsx` deleted rather than moved.
   - DONE — `MulticastProvider` registry extracted to
     `src/plugins/multicast/` (§3), fixing a real provider-list drift bug
     in the process. `RtmpTarget.provider` typing + UI de-dup still open.
   - DONE — `FingerprintProvider` interface extracted to
     `src/plugins/fingerprinting/` (§6), wrapping the existing AcoustID
     calls.
   - Still open: delete `IMPORT_SERVICES` duplication in favor of
     `SOURCE_DEFS` (§5's quick win, independent of the larger Import
     extraction below).
3. **Medium**: DONE — the `src/plugins/audio-fx/` registry + preview-graph
   dispatch (§2). Deliberately did **not** wait for a generic plugin-chain
   host component to be factored out of `StudioProEditorView.tsx` first
   (this doc originally said to) — the registry extraction turned out to
   be independently valuable (a real plugin-authoring contract, unit
   tests, no more if/else per plugin id in the preview-graph hook) even
   with the host UI unmoved. The host-UI factor-out is still open, just no
   longer a blocker for the registry half.
4. **Design work before code**: Export's registry was relocated (§4,
   `src/plugins/export/`) but still has no real per-implementation
   behavior — write the `ExportProvider` interface first, implement
   Revelator against it, *then* the extraction is actually done
   (Fingerprinting's `FingerprintProvider` half of this item already is,
   see §6).
5. **Largest, do last**: Visualizers is DONE (§7). Import's kind adapters
   are DONE (§5) — OAuth/search/tool contracts plus Add-ons/Upload hosts.
   Export remains metadata-only until sibling submit/status/webhook
   routes exist.

## Pending — Nuclear plugin-registry gap follow-up

- **Kick / Twitch**: already fully wired, not a gap — `tahti/apps/api`'s
  `rtmp-targets.ts` has real ingest URLs baked in for both
  (`PROVIDER_RTMP_URLS`), and both are already options in
  `StudioGoLiveView`'s multistream provider dropdown.
- **mikseri.net**: official embed integration shipped in tahti-web. It is a
  repo-native listener widget and Studio reference import, not a downloadable
  marketplace plugin; it never scrapes or copies Mikseri audio.
- **Skipped per explicit direction**: NetEase Cloud Music, KHInsider (not
  a fit for this audience).
