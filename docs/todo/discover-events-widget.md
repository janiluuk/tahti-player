# Discover: upcoming events list, events card-row widget, seed events

**Status:** open

Requested 2026-11-22. Builds on [discover-events-tab.md](discover-events-tab.md).

1. **Seed events in production.** Add a few sample events with artwork so the Events tab and the widget are not empty. Production write: needs the user's go-ahead and an admin session (or a tahti-org seed script); mark them clearly so they can be removed later.
2. **Next events list on Discover → Events.** The tab opens with the upcoming events first (soonest first), above the filters / calendar.
3. **Events card-row widget.** A horizontal card row of upcoming events (artwork, title, date, place) built from `@tahti-player/ui` cards (`MediaArtwork` with the default artwork for events without a banner). Reuse the event fetcher behind the Events tab and the "Coming up" row (`components/listen-view/HomeComingUp.tsx`).
4. **Add it to Discover as a widget.** New widget id (e.g. `upcoming-events`) in `components/discover/widgetMeta.ts` (`WIDGET_LABEL_KEYS`, icon, description), available in the Add widget picker and in the default layout; English + Finnish strings.

Done when: the Events tab lists upcoming events first, the Discover page shows the events widget, mock mode has events with artwork, Storybook story + vitest for the widget, an e2e step on the mock app.
