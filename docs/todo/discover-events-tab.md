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
  `e2e/event-calendar.spec.ts` (not run yet).

## Left

- [ ] Run the new e2e cases in `e2e/event-calendar.spec.ts`.
- [ ] Storybook story for `EventPostView` (VIEW-CATALOG says Missing story).
- [ ] Filters (date range, city/venue), past toggle, calendar toggle on the
      Events tab. Needs org: `GET /api/v1/events/upcoming` takes only
      `limit` (1-50), no offset/cursor, no from/to, city or venue filter,
      no past scope.
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

