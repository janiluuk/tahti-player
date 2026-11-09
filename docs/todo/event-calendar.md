# Event calendar under Feed

**Status:** partial

Artists create events, tag the other people involved, preview, publish, and push them out to other services. Listeners find them in a calendar under Discover → Feed.

## What exists (2026-11-09)

- `api/events.ts`: `ArtistEvent { id, title, description, place, location, eventUrl, startAt }` with create/update/delete and `fetchChannelEvents(slug)`; Studio `/studio/events` (list, new, detail, edit); channel page upcoming events; Listen "Coming up" row (`api/upcoming-events.ts`).
- Verified venues (`/venues`, `RecordedAtVenuePicker`), so a place can be a real venue record.
- Social auto-post for Mastodon and Bluesky (`api/social-autopost.ts`, Settings → Integrations).
- Feed is Discover's `feed` tab (`/feed` redirects there).

Missing: end time, draft/published state, tagged people, a cross-artist calendar, preview, export/aggregation.

## Product decisions to confirm

- [ ] Who can be tagged: any Tahti user (artist, DJ, venue account) or also free-text guests? Proposal: Tahti accounts as tags plus free-text "also featuring".
- [ ] Does a tag need the tagged person's consent before it shows publicly? Proposal: tag shows as "pending" until accepted; accepted events also list on the tagged artist's channel.
- [ ] Which outside services first: Mastodon + Bluesky (already connected), an `.ics` feed per artist and for the whole calendar, Google Calendar "add" link. Later: Facebook Events, Resident Advisor, Bandsintown (need partner APIs / approval).
- [ ] Ticket links and price: one external ticket URL, or tiers?

## Data model (tahti-org)

- [ ] Extend the event: `endAt`, `timezone`, `status` (`DRAFT | PUBLISHED | CANCELLED`), `venueId` (optional, verified venue) alongside free-text `place`/`location`, `imageUrl` (cover, default artwork per CLAUDE.md), `ticketUrl`, `visibility` (`PUBLIC | FANS`), `publishedAt`.
- [ ] `EventParticipant { eventId, userId, role (PERFORMER | HOST | GUEST), status (PENDING | ACCEPTED | DECLINED) }`.
- [ ] `EventSyndication { eventId, target (MASTODON | BLUESKY | ICS | …), status, externalUrl, postedAt, error }`.
- [ ] Endpoints: CRUD with status transitions (`POST /events/:id/publish`, `/cancel`), participant invite/accept/decline, public calendar `GET /events?from&to&near&genre&artist`, `GET /u/:username/events.ics`, `GET /events.ics`.
- [ ] Notifications: tagged person gets an invite notification; followers of every accepted participant get "new event" when published; reminder the day before for listeners who saved it.

## Slices (tahti-web)

1. [x] API client + mock fixtures for the extended event, participants and syndication (mock-first, `VITE_FORCE_MOCK`).
2. [x] Studio event editor: end time, timezone, venue picker (verified venues + free text), cover image (default artwork), ticket link, visibility.
3. [x] Tag people: user search picker (`@tahti-player/ui` combobox), role per person, pending/accepted chips.
4. [x] Draft → preview: the event's public card and detail page rendered from the draft in a preview dialog (same components as the public page, "Preview" badge).
5. [x] Publish / unpublish / cancel with ConfirmDialog; cancelled events stay visible with a "Cancelled" badge.
6. [x] Invites inbox: accept/decline tags (notifications popover + Studio Events "Invites" tab).
7. [x] Public event page `/events/$eventId`: cover, time in viewer's timezone (`ListingDate`), venue, participants, ticket link, add-to-calendar (.ics / Google), share.
8. [x] Calendar under Discover → Feed: a "Calendar" sub-view next to the story feed — month grid on desktop, agenda list on phones; filters (following only, near me, genre); saved events.
9. [x] Channel page events block uses the same card; tagged (accepted) events appear on every participant's channel.
10. [x] Aggregation on publish: per-event toggles for Mastodon/Bluesky (reuse social auto-post connections), status per target with retry; `.ics` subscribe links on artist page and calendar.
11. [x] Listen "Coming up" row reads from the new public calendar endpoint.
12. [x] Finnish strings for all of the above; Storybook stories + plays for editor, preview, invite, calendar; e2e journey: create → tag → preview → publish → appears in calendar and on both channels.

## Shipped 2026-11-09 (tahti-web, PR after tahti-org #1079–#1081)

Slices 1–8: `api/event-calendar.ts` (calendar, public event, publish/cancel, tags, invites, .ics + Google links), editor end time / ticket / cover links / save as draft / preview, Studio event detail status + publish/cancel + tag editor, Studio Events "Invites" tab, `/events/$eventId`, Discover → Feed → Calendar (`?tab=feed&view=calendar`, month grid / list). Then slices 9 and 11: the channel events block uses `EventCard` (accepted tags, Cancelled badge, artist .ics Subscribe) and Coming up cards open the event page; stories for EventCard, EventCalendar, EventInvitesPanel, EventParticipantsEditor and EventView. E2e: `e2e/event-calendar.spec.ts` (draft → preview → tag → publish; Feed calendar → event page signed out; accept an invite); `/events/` is open to signed-out visitors. Slice 10: Publish offers the connected Mastodon / Bluesky accounts, the API queues a post with the event link (tahti-org #1083), and the Studio event page shows each post's status with Retry (tahti-org #1084, tahti-player #1953). Tag notifications (`EVENT_TAGGED`) open Studio Events → Invites (#1952). Left: timezone, verified-venue link (`venueId`) and visibility (`PUBLIC | FANS`) fields — need an API design first; invites inline in the notifications popover; remove the two `/api/me/events/:id/shares` allowlist entries once tahti-org releases #1084.

## Open questions

- Recurring events (weekly club nights) now or later?
- Should Tahti Radio shows / listening parties also appear in the calendar (they already have their own schedule)?
