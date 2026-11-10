# Listen: remove widget while editing order

**Status:** open  
**Updated:** 2026-11-10

## Goal

On Listen, when the user is editing widget ordering, allow removing a widget
from the dashboard in that same mode.

## Behaviour

- Show a remove control on each widget while reorder/edit is active.
- Confirm before remove. Warn that:
  - they must add the widget back via Manage / Add widget, **or**
  - use **Reset widgets**, which restores the full default set (not just the
    removed one).
- Do not wipe per-widget settings on remove (same as today’s
  `RemoveWidgetDialog` / Listen remove); only the place on the dashboard.

## Done when

- [ ] Remove control visible only in reorder/edit mode
- [ ] Confirm copy covers add-back vs Reset widgets → defaults
- [ ] Unit or Storybook coverage for the confirm path
