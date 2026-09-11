# Migrate DropdownButton call sites to raw Popover + Menu

**Status:** open

## Ask (user, 2026-09-11)

Prefer the raw `Popover` + `Popover.Menu`/`Popover.Item` composition (already
documented in Storybook: `Components/Popover` → **Dropdown Menu** /
**Sectioned Menu** stories) over the packaged `DropdownButton` wrapper, and
plan migrating existing app call sites to it.

Cross-referenced both Storybook docs pages (2026-09-11) so `DropdownButton`
points at the Popover pattern and vice versa. No app code changed yet —
this file is that plan.

## Why

`DropdownButton` is a thin, opinionated wrapper: fixed trigger shape (a
`Button` with `label`/`icon`/chevron), flat `items` list, no sections, no
footer. It fits the narrow "collapse related action variants into one
button" case it was built for. Composing `Popover` + `Popover.Menu`
directly is more flexible (custom trigger — icon button, table row, card;
sectioned menus; a footer item) and is one fewer abstraction for
contributors to learn, since `DropdownButton` is itself just this
composition with the trigger and item-list flattened into props.

## Current call sites (2 in the app, 1 in Storybook demos)

| File | Usage | Notes |
| --- | --- | --- |
| `packages/tahti-web/src/components/ChannelDesigner.tsx` | `label="…"` (icon-only "more options" toolbar trigger) + Save preset / Reset items | Straightforward: `Popover` trigger = an icon button, `Popover.Menu` with the same two `Popover.Item`s. |
| `packages/tahti-web/src/views/MyDiscographyView.tsx` | `label={sortLabel}` (dynamic sort-order trigger) + `SORT_OPTIONS.map(...)` items | Trigger needs to show the active sort label; straightforward `Popover` + `Popover.Menu` swap, map `SORT_OPTIONS` to `Popover.Item`s directly instead of through `DropdownButtonItem`. |
| `packages/storybook/src/DropdownButton.stories.tsx` | Demo stories only | Keep `DropdownButton` (and its stories) around as the packaged option for the simple case — see "Keep or deprecate" below. |

## Keep or deprecate `DropdownButton`?

Not decided. Two options once the 2 call sites above are migrated:

1. **Keep it** as a documented convenience wrapper for the simple case
   (plain button trigger, flat item list, no sections) — cross-links
   already added both ways in Storybook docs (2026-09-11).
2. **Deprecate/remove it** once no app call site needs the convenience,
   pushing everyone to compose `Popover` directly for consistency.

Needs a product/DX call before doing either — not assumed here.

## Suggested approach when picked up

1. Migrate `ChannelDesigner.tsx`'s toolbar trigger first (smaller, no
   dynamic label).
2. Migrate `MyDiscographyView.tsx`'s sort trigger.
3. Verify both visually (Storybook doesn't cover either — they're
   real-app, not Storybook, call sites) plus `tsc --noEmit` / `eslint` /
   existing tests.
4. Revisit the keep-or-deprecate question above once both are migrated.
