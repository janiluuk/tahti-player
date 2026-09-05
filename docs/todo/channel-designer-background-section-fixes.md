# Channel Designer Background section: three related reports

**Status:** partial
not a guess.

## 1. Background color shown in every header mode, not just Solid — fixed

`PageBackgroundField` (`components/channel-designer/BackdropPanel.tsx`)
was rendered unconditionally at the top of the Backdrop panel,
regardless of `headerMode`. **Deviated slightly from the literal
report** ("only under solid"): hid it specifically when
`headerMode === 'GRADIENT'` instead, because `AccentPairFields`
(Solid/Video/Slideshow's shared accent picker) has no `bg` field of its
own — `PageBackgroundField` is the *only* way to set the page
background color in Solid, Video, and Slideshow modes. Only `GRADIENT`
mode already has its own `bg` swatch (inside `ColorSchemeFields`), which
made it the genuinely redundant case. Hiding it under Video/Slideshow
too, as the literal wording suggested, would have removed the only way
to set that color there — a real regression, not a fix.

## 2. Gradient/background color labels borrowed player-specific wording — fixed

`ColorSchemeFields` (shared by `PlayerGradientControls`,
`BackdropBackgroundExtras`, and `BackdropPanel`'s own Gradient tab) had
its own doc comment admitting it's "shared for header, player, and page
palettes" — but its labels were hardcoded to the *player's* waveform
seekbar: "Accent / waveform played", "Muted / waveform unplayed". Fine
for `PlayerGradientControls`; nonsensical for the header's gradient
colors or the page's separate background palette, where there is no
waveform. Matches the report: "the names of the gradient colors are
for different container."

Added a `variant?: 'player' | 'generic'` prop (default `'player'`,
preserving `PlayerGradientControls`' existing behavior unchanged) with
a `generic` label set that drops the waveform wording. Passed
`variant="generic"` at the two non-player call sites
(`BackdropPanel.tsx`'s Gradient tab, `BackdropBackgroundExtras.tsx`).
Added a `Generic` Storybook story alongside the existing default to
document both label sets.

## 3. "Background section should have a visualization tab" — not changed, needs a decision

Investigated: `BackdropBackgroundExtras.tsx` already has a
"Background visualizer" section with an icon-preview grid over every
`BACKGROUND_VISUAL_PRESETS` entry (`visualizerMetadata(preset).Icon` +
name, selectable) — this already substantially matches "previews of
different kinds of visualizations... reserved for it." It is **not**
one of the segmented `HeaderStyleTabs` options (Gradient/Solid/Video/
Slideshow) though — it renders as an always-visible section *below*
those tabs, independent of which header mode is selected.

That's not an oversight: the data model treats the header style
(Gradient/Solid/Video/Slideshow) and the ambient background visualizer
as **orthogonal**, not mutually exclusive — you can currently combine,
say, a Solid header with an ambient WebGL visualizer running behind the
whole page. Turning "Visualization" into a 5th mutually-exclusive tab
alongside the others would break that combination, unless the intent
is actually for it to fully *replace* the header treatment when active
(a real semantic change, not a UI relabel). Didn't guess at which one
was meant — flagging for a decision rather than picking one and risking
breaking the layering that already works.

## Verification

`tsc --noEmit` (both `tahti-web` and `storybook` packages), `eslint`,
and `pnpm --filter @tahti-player/tahti-web build` all pass. No test
files exist for any of the three touched components; none added. Not
manually verified in a running browser or Storybook.
