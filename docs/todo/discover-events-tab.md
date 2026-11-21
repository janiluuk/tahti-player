# Discover: Events tab (listing, posting, banners, event page visuals)

**Status:** partial

Requested 2026-11-20: an event listing as a tab under Discover; users can post
events with a venue selector and banners; a visualization on the event page.

## Decisions

- Any signed-in user can post an event; signed-out visitors see the list and
  a sign-in prompt on Post.
- Banner: uploaded image cropped to a wide 3:1 banner (1800 px wide).
- Event page visual: the banner (or default artwork) as a blurred, slowly
  drifting backdrop behind the hero; static under `prefers-reduced-motion`.

## Done (2026-11-20, first PR)

- Discover → **Events** tab (`?tab=events`, `DiscoverEventsPanel`): upcoming
  events (`fetchUpcomingEvents(50)`) as banner cards, time in the event time
  zone (`formatScheduleWindow(..., timeZone)`), venue + city, Post event.
- Shared `components/events/EventForm.tsx` used by Studio
  (`StudioEventCreateView`) and the new public `/events/new` +
  `/events/$eventId/edit` (`EventPostView`). Drafts, Fans only and social
  announcements stay Studio-account only.
- `EventBannerField`: FilePicker → `ImageCropDialog` (aspect 3, 1800 px) →
  `uploadUserMediaFile` → `imageUrl`; preview + Remove.
- `EventView`: banner hero over `EventBannerBackdrop`, venue block, Edit for
  the host; back link goes to Discover → Events.
- Mock upcoming list now comes from the calendar mock, so mock ids open on
  the mock event page.
- Unit tests, `Tahti/Discover/DiscoverEventsPanel` story, e2e cases in
  `e2e/event-calendar.spec.ts` (all pass).

## Left

- [x] e2e `e2e/event-calendar.spec.ts`: all 5 cases pass on the mock app (2026-11-21); the Studio draft case now expects `/studio/schedule?show=events`.
- [x] Storybook story for `EventPostView` (shipped in #2110).
- [x] Filters on the Events tab: range presets (Upcoming / This week / This
      month / Next 3 months), Past (last 92 days, newest first), city, venue
      (narrowed by city), debounced text search, List / Calendar
      (`EventCalendar` with the filtered events). All on the calendar
      endpoint `GET /api/v1/events?from&to` (max 92 days), so no API change
      was needed. URL: `/discover?tab=events&range&past&city&venue&q&view`.
      Code: `components/discover/eventFilters.ts`, `useDiscoverEvents.ts`,
      `DiscoverEventsFilterBar.tsx`.
- [ ] Live check after merge: a listener (no channel) posts an event with a
      banner and it shows on Discover → Events.

## Event gallery (requested 2026-11-20)

Thumbnail gallery on the event page; full-screen slideshow that moves with
the keyboard (arrows, Home/End) and the mouse wheel / trackpad scroll; every
image has a caption. Go-ahead given to change tahti-org.

- Shipped: tahti-org `ArtistEvent.gallery` (tahti-org#1122, migration
  `20261120120000_artist_event_gallery`); web gallery field, event page grid
  and full-screen `ImageLightbox` (wheel / PageUp / PageDown / swipe,
  captions) on `feat/web-event-gallery`. The lightbox is full screen for every
  caller now (artist gallery, admin user too).
- [ ] Deploy the API (migration) to production; until then saving an event
      with gallery images fails, events without images save as before.
