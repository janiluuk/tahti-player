# Channel backdrop slideshow: rotation + transitions unwired

**Status:** partial

## What's broken

Channel Designer's "Static slideshow" gallery mode lets a user upload
multiple backdrop images and configure `slideshowPreset` (FADE / ZOOM /
PAN / BLUR_CROSS / PARTICLE_DISSOLVE / GLITCH_WIPE / CUBE_FLIP /
LIQUID_DISTORTION), `slideshowIntervalSeconds`, `slideshowTransitionMs`,
and `slideshowAutoplay`. These save to the backend correctly. But on the
**real published channel page**, `ChannelBackdropCard.tsx`'s
`showSlideshow` branch just renders `slideshowImages[0]` as a single
static `<img>` — it never reads or uses any of the 4 settings above, so
a configured slideshow never rotates or transitions for real visitors.
Only the editor's own live-preview thumbnail strip (`ChannelDesigner.tsx`
`galleryPreviewIndex`) shows any cycling, and even that just instant-swaps
images with no transition effect applied.

Confirmed this isn't a backend gap: `../tahti-org/apps/api/src/routes/
channels/get.ts` and `routes/profile/public.ts` already select and
return all 4 fields on the public channel/profile response
(`packages/shared/src/dto/api-responses.ts` schemas). tahti-web's
`PublicChannel` type (`src/api/types.ts`) just never modeled them, and
`ChannelView.tsx` never passed them to `ChannelBackdropCard`.

Separately, `ChannelDesigner.tsx`'s `GALLERY_MODES` dropdown also lists
5 WebGL "gallery" modes (`TWISTED_WAVE_GLSL`, `ZOOM_BLUR_GLSL`,
`RGB_SHIFT_GLSL`, `POSTER_WALL_GLSL`, `SHATTER_CAROUSEL_GLSL`) that
`ChannelBackdropCard` also doesn't render at all (falls through to the
visualizer/artwork branch) — **out of scope for this ticket**, tracked
below as a separate follow-up since it's a different UI paradigm
(horizontal scrolling multi-image gallery strip, not a single rotating
backdrop) that needs its own placement decision.

## Source

`../tahti-org/apps/web/src/components/visuals/slideshow-transitions/*`
has fully framework-agnostic (pure Three.js + DOM, no Next.js coupling
beyond a no-op `'use client'`) implementations of the 4 WebGL presets:
`shader-transition-base.tsx` (shared full-screen-quad crossfade —
`particle-dissolve.tsx`/`glitch-wipe.tsx`/`liquid-distortion.tsx` are
each just a ~40-60 line fragment shader plugged into it) and
`cube-flip.tsx` (full 3D scene, doesn't use the shared base). `three` is
already a tahti-web dependency (`^0.184.0`).

## Plan

1. Add the 4 missing fields to `PublicChannel` (`src/api/types.ts`) and
   pass them from `ChannelView.tsx` into `ChannelBackdropCard`.
2. Port `shader-transition-base.tsx` + the 4 presets into
   `src/components/visuals/slideshowTransitions/` (trim `next/dynamic`
   → `React.lazy`, drop the unrelated gallery-strip helpers from
   `shared.ts`, keep only `loadGalleryTextures`/`textureAspect`).
3. In `ChannelBackdropCard.tsx`: when `slideshowImages.length > 1` and
   `slideshowAutoplay`, cycle on `slideshowIntervalSeconds`. CSS-only
   presets (FADE/ZOOM/PAN/BLUR_CROSS) crossfade two stacked `<img>`
   layers; WebGL presets mount the ported transition overlay for
   `slideshowTransitionMs` between the current and next image. `!
   autoplay` or a single image keeps today's static-first-image
   behavior.
4. Storybook: enrich `ChannelBackdropCard.stories.tsx` with a story per
   preset (short interval/duration so the effect is visible quickly),
   autoplay on/off, and a `parameters.backgrounds` light/dark swatch —
   the tahti-org/Storybook survey found **no story in the repo varies
   background or theme**, this is the first concrete instance of fixing
   that. Maybe a dedicated `SlideshowTransitions.stories.tsx` demoing
   each WebGL preset in isolation.

## 2026-09-09: shipped

All 4 steps of the plan above are done:

- `PublicChannel` (`src/api/types.ts`) now models `slideshowPreset`/
  `slideshowIntervalSeconds`/`slideshowTransitionMs`/`slideshowAutoplay`;
  `ChannelView.tsx` passes them through to `ChannelBackdropCard`, and
  `ChannelDesigner.tsx`'s own live-preview call got the same 4 props so
  the editor's preview is no longer static either.
- Ported `shader-transition-base.tsx` + all 4 WebGL presets (pure
  Three.js/DOM, zero framework-specific code to adapt beyond
  `next/dynamic` → `React.lazy`) into
  `src/components/visuals/slideshowTransitions/`.
- New `ChannelSlideshowBackdrop.tsx` component owns the rotation timer
  (`slideshowIntervalSeconds`) and dispatches to either
  `CssCrossfadeTransition` (FADE/ZOOM/PAN/BLUR_CROSS — new, not in
  tahti-org, since those 4 presets don't need WebGL) or
  `WebglSlideshowTransition` (the other 4) for `slideshowTransitionMs`,
  then advances. `ChannelBackdropCard`'s `showSlideshow` branch now
  renders this instead of a bare `<img src={slideshowImages[0]}>`.
- 5 unit tests (`ChannelSlideshowBackdrop.test.tsx`) cover empty/single
  image, autoplay off, a full FADE rotation cycle, and resetting on an
  image-set change — scoped to the CSS path since jsdom has no WebGL
  context and this repo has no existing canvas-mocking convention to
  test the WebGL branch against (Three.js components are Storybook-only
  here, matching the pattern already used for `ChannelVisualizer`).
- Storybook: `ChannelBackdropCard.stories.tsx` gained `Slideshow` (preset
  selectable via controls), `SlideshowGlitchWipe`, `SlideshowCubeFlip`,
  `SlideshowAutoplayOff`, plus `WarmPalette`/`CoolPalette` color-scheme
  variants (the first per-story background/palette variance in this
  component, per the earlier "no story varies background" survey
  finding). New `ChannelSlideshowBackdrop.stories.tsx` showcases all 8
  presets individually as their own primitive.
- `tsc --noEmit`, `eslint`, `vitest run` (504/504 unit tests) all pass;
  `storybook build` succeeds with the new/edited story files included.
  **Not live-browser-verified** — the Claude-in-Chrome extension wasn't
  connected this session, so the WebGL shaders (cube-flip's 3D rotation,
  the 3 shader crossfades) are unverified beyond "compiles and the dev
  server serves the page"; the CSS presets are exercised for real by the
  unit tests' actual DOM/style assertions, which is closer to a real
  check.

Left `partial` (not folded to HISTORY) because of the unverified WebGL
render and the explicitly-scoped-out items below.

## 2026-09-09: live-browser verification (Claude-in-Chrome)

- **CSS path confirmed working for real**: loaded `ChannelBackdropCard
  — Slideshow (rotating, preset-selectable)` in Storybook
  (FADE, 3s interval, 700ms transition) and watched it live —
  screenshots taken ~3s apart show the backdrop actually cycling
  through the 3 configured `picsum.photos` seed images (dune → foggy
  lake → snowy forest → back to dune), not a static first frame. This
  is the fix this ticket set out to make; it's real.
- **WebGL presets (Cube flip, Glitch wipe) fail to render in this
  automation environment specifically** — both throw at mount:
  `THREE.WebGLRenderer: A WebGL context could not be created. Reason:
  Could not create a WebGL context, VENDOR = 0x10de, DEVICE = 0x1c03,
  Sandboxed = yes, Optimus = yes, ... BindToCurrentSequence failed`.
  That's the Chrome GPU process failing to init on this NVIDIA-Optimus
  Linux box under the extension's sandboxed renderer — a host/browser
  limitation, not a code path caught by the error boundary (which
  itself worked correctly, showing an error state instead of a blank
  crash). Consistent with the existing repo pattern noted above of
  Three.js components being Storybook-only/hard-to-headless-test here.
  Not re-confirmed against a normal (non-automated) browser tab this
  session — if the user wants a stronger guarantee before shipping,
  that's the one remaining check.

## Explicitly out of scope (follow-ups, not started)

- The 5 `WEBGL_GALLERY_MODES` horizontal gallery-strip renderers
  (`../tahti-org/apps/web/src/components/gallery/*`) — separate UI
  paradigm, needs a placement decision (where does a "gallery" section
  even live on the channel page today?) before porting.
- Repo-wide Storybook background/state enrichment (the survey found
  ~68 stories, none with background variance) — this ticket only fixes
  it for `ChannelBackdropCard`, as a demonstrated pattern.
- Small tahti-org `packages/ui/src/brand/*` primitives with no tahti-web
  equivalent (`Pill`, `RankBadge`, `StatCard`, `ChipFilterBar`,
  `TierCard`, `WaveformPlayer`, `BroadcastStatusBar`, `GuidedTour`,
  `NotificationBell`/`MessagesBell`, `Breadcrumb`, `AvatarTile`,
  `MemberBadge`) — not "player visualizers and theme", user narrowed
  scope away from these this pass.
- `themes/theme-editor.tsx`/`theme-preview-card.tsx` vs. tahti-web's own
  `ThemeEditor.tsx` — not yet diffed for missing capability.
