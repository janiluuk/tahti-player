# Migrate DropdownButton call sites to raw Popover + Menu

**Status:** partial

## Progress (2026-09-12)

Both app call sites migrated to raw `Popover` + `Popover.Menu`/`Popover.Item`:

- `ChannelDesigner.tsx`'s "More" toolbar trigger (icon-only `…` +
  `aria-label="More options"`, carried over from the a11y fix made on
  `feat/ui-polish-batch` after this branch forked) — Save preset / Reset
  items, same icons/disabled-when-!dirty behavior as before.
- `MyDiscographyView.tsx`'s sort trigger — dynamic `sortLabel`, `SORT_OPTIONS`
  mapped straight to `Popover.Item`s.

Verified visually via temporary Storybook stories mounting the exact migrated
JSX (not committed — deleted after checking): trigger renders, menu opens
with correct items/icons/labels, dynamic sort label updates on select. Menu
does not auto-close on item click in either case — same as the old
`DropdownButton` (neither ever wrapped `onClick` to close), so this is not a
regression. `tsc --noEmit` / `eslint` / `prettier` clean on both files.

Remaining: the "Keep or deprecate `DropdownButton`?" decision below — not
resolved, so `DropdownButton` itself and its Storybook stories are left in
place per option 1 (keep as documented convenience wrapper) until someone
makes that call.

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
| `packages/tahti-web/src/components/ChannelDesigner.tsx` | Migrated (2026-09-12) — `Popover` trigger with `…` + `aria-label="More options"`, `Popover.Menu` with Save preset / Reset items. | Done. |
| `packages/tahti-web/src/views/MyDiscographyView.tsx` | Migrated (2026-09-12) — `Popover` trigger showing the dynamic `sortLabel`, `SORT_OPTIONS` mapped to `Popover.Item`s. | Done. |
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
