# Tahti theme refactor: orange overuse, contrast, visualizer visibility/toggle

**Status:** open

Roadmap item (2026-09-07, queued for after the current workplan cycles).

## Reported problem

In some views, buttons and dropdown/select backgrounds are almost all a
loud orange/coral, with black text — reads as broken/unusable, not just
"too much accent color." Also: the theme is supposed to have a background
visualizer, but it can't be seen (background may need more transparency),
and there's no way to turn the visualizer on/off from theme settings for
the affected theme.

Visually confirmed independently while verifying an unrelated change this
session (`packages/tahti-web/scripts/capture-map-screens.mjs`-adjacent
manual screenshot, mock session): sidebar nav pills, tab pills, the
in-review theme banner + its "Acknowledge" button, notification badges,
and player-bar controls all rendered in the same salmon/coral tone.

## Root cause (found this session, not yet fixed)

`Button`'s **default** variant and `Select`'s **only** variant both
hardcode the theme's `--primary` token as their background
unconditionally:

- `packages/ui/src/components/Button/Button.tsx` (default variant):
  `'text-primary-foreground bg-primary ...'`
- `packages/ui/src/components/Select/Select.tsx`: `'border-border
  bg-primary text-primary-foreground ...'` — no secondary/neutral variant
  exists for `Select` at all (unlike `Button`, which does have
  `variant="secondary"` / `"text"` escape hatches already used in plenty
  of call sites).

So for any theme whose `--primary` is a saturated/light color (here:
orange), **every** `Button` left at its default variant and **every**
`Select` anywhere in the app renders in that color — not just the
genuinely important actions (primary navigation, Save). This is a
systemic design-system default, not a per-view bug: fixing it means
either (a) auditing call sites to use `variant="secondary"` for ordinary
actions and reserving the default/primary variant for nav + Save-class
actions, and/or (b) giving `Select` a non-primary default background so
dropdowns aren't loud by default, and/or (c) fixing the specific theme's
`--primary`/`--primary-foreground` pair to have real contrast if it's
going to be used this broadly regardless.

**Not yet determined:** which theme(s) are affected, and this matters —
a second screenshot (`Settings > Account`, `variant="secondary"` button)
showed the "Keyboard shortcuts" button in the *same* orange as the
default-variant ones nearby, even though `secondary` is a genuinely
different token (`bg-secondary`, not `bg-primary` — see
`Button.tsx`'s `buttonVariants`). That session had no theme explicitly
selected, so it fell back to `DEFAULT_THEME_ID = 'nuclear:default'`
(`plugins/themes/store.ts`) — which reads as **stock upstream Nuclear's
own default palette** (Nuclear's real branding is exactly this kind of
reddish-orange), not a Tahti preset (`nuclear:tahti-dark` /
`custom:tahti-blue`, `plugins/themes/presets.ts`) or a broken custom
theme. So the orange-everywhere complaint may really be "logged-in
default state before picking a theme still looks like unbranded stock
Nuclear" rather than a bug in a specific named Tahti theme — if so, the
fix is giving `nuclear:default` (or whatever ships as the actual
out-of-the-box experience) a real `--secondary`/`--tertiary` distinct
from `--primary`, not auditing component variants. Needs confirming
which theme the report means before doing anything.

## Background visualizer

`ThemeVisualizationSettings.tsx` (Settings → Themes) already exists and
already has an enable/disable `Toggle`, preset picker, opacity/speed/
intensity sliders, and an audio-reactive toggle — but it's gated:

```ts
const VISUALIZATION_THEME_IDS = new Set([TAHTI_THEME_ID, TAHTI_BLUE_THEME_ID]);
```

If the theme in question isn't one of those two ids,
`isThemeVisualizationEnabled(themeId)` is false and the whole settings
panel renders "Background visualization settings are not available for
this theme yet." instead of the real controls — this is the most likely
explanation for "the visualizer can't be selected from theme settings."
Once the affected theme id is confirmed, either add it to
`VISUALIZATION_THEME_IDS` or generalize the gate.

Separately: the report that the visualizer "cannot be seen" needs a live
check against `AmbientBackground.tsx`/`useAmbientStore`'s `opacity`
default and the theme's background color — possibly the background is
too opaque over the canvas, or the default opacity is too low. Needs
visual verification with the actual affected theme active, not a guess.

## Scope (not started)

1. Identify the exact theme(s) with the orange-everywhere problem.
2. Decide the fix direction for `Button`/`Select` defaults: per-callsite
   variant audit vs. a new neutral default vs. both.
3. Give `Select` a non-primary default variant (or a `variant` prop at
   all — it currently has none).
4. Confirm contrast (`--primary` vs `--primary-foreground`) meets a
   reasonable readability bar for whichever theme(s) keep using primary
   broadly.
5. Fix visualizer visibility (opacity/transparency) for the affected
   theme, live-verified.
6. Add the affected theme id(s) to `VISUALIZATION_THEME_IDS` (or
   generalize the gate) so the existing `ThemeVisualizationSettings`
   panel actually shows up for it.
