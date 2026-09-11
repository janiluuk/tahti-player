# Channel designer rail + Broadcast menu + Tahti dark

**Status:** partial

## Shipped this pass (2026-09-11)

- Channel Designer / layers menu docks into the Nuclear **right rail** on
  desktop (no floating overlay blocking the form). Mobile keeps the bottom
  sheet.
- Tahti dark: opaque `--background` on `.tahti-ambient-surface` (was
  translucent color-mix); removed ambient `:has()` accent-orange remap so
  content origin/colors match other themes.
- Top Broadcast menu: booking opens `RadioBookingCalendar` modal; removed
  Broadcast Studio + separate Stream Manager items; **24/7 rotation** opens
  Stream Manager dialog.
- Broadcast / Go Live panel no longer embeds `StreamManagerPanel` (rotation
  presence derived from LIVE without ingest signal). Stream Manager remains
  reachable from the top-menu 24/7 rotation entry.

## Left

- Manual browser pass on Branding designer + channel edit + tahti-dark Listen.
