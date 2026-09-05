# Channel Designer: right panel height was covering Save/Reset

**Status:** done (2026-09-05), not manually verified live — see caveat.

## Root cause

`ChannelDesigner.tsx` is used in two structurally different contexts:

1. **`lookOnly`** — embedded inside `ChannelLayersMenu`'s fixed-height
   floating sidebar (`ChannelView.tsx`'s inline `?edit=true` editor).
   This is a well-formed flex chain (`aside h-full` →
   `div flex-1 min-h-0` → `div h-full min-h-0`) where `h-full` on the
   inner `ChannelElementEditor` correctly fills the available space and
   scrolls internally — this path has no Save/Reset row at all (that
   lives in `ChannelView.tsx`'s own "Save changes"/"Done" buttons
   instead).
2. **Full/wide mode** — used directly by `StudioBrandingView.tsx`'s
   "Channel Designer" tab. Here `controls` (the same
   `ChannelElementEditor`, same `h-full` className) sits inside
   `<section className="min-w-0 lg:sticky lg:top-4">`, which is a **CSS
   Grid item** (`grid ... lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start`)
   with no explicit height of its own. `height: 100%` inside a
   grid item whose row height is otherwise auto/content-driven is a
   long-standing browser quirk — the row's percentage-resolution base
   isn't well-defined, so combined with `overflow-hidden` further down
   the chain, the panel could end up either the wrong height or
   overlapping the "More"/Save/"Reset" (via More)/`openChannelLink` row
   that sits *above* the grid in the same document flow, matching the
   report ("the designer panel that is covering them").

## Fix

`ChannelElementEditor`'s `className` is now conditional on `lookOnly`:
`h-full` only applies in the sidebar-embedded case, where it's needed
and well-formed. In the full/wide `StudioBrandingView` case, it's
dropped entirely — the panel now sizes to its natural content height
("only as tall as necessary," per the request) instead of an ambiguous
percentage height, and the page scrolls normally instead of relying on
an internal dock-scroll region that wasn't reliably bounded to begin
with.

## Caveat

This diagnosis is based on static analysis of the CSS/component
structure (grid `align-items: start` + percentage height inside an
auto-sized track, a well-documented category of layout bug), not a
live browser reproduction — no browser tooling was available in this
pass to confirm the exact visual overlap before/after. Worth a quick
look at Studio → Branding → Channel Designer to confirm Save/Reset are
now reliably visible without scrolling weirdly, and that the panel
still looks reasonable (not oddly short) with a small amount of content
selected (e.g. the "About" section) vs. a lot (e.g. "Background" with
many fields).

## Verification

`tsc --noEmit`, `eslint`, and `pnpm --filter @tahti-player/tahti-web
build` all pass. No test coverage exists for either
`ChannelDesigner.tsx` or `ChannelElementEditor.tsx`; none added.
