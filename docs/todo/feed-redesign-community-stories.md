# My feed redesign + Community stories widget

**Status:** partial

Make Listen → Feed (`/listen/feed`, `views/FeedView.tsx`) read like an
editorial row of wide story cards, and add a Discover **Community stories**
widget that collects artists' posts from everyone, in the same card style.

## Reference (user screenshot, 2026-10-30)

A "Community stories" row with round prev / next buttons at the top right and
three wide cards per row. Each card, with no box or border around it:

- 16:9 image with rounded corners (an artist's post image)
- meta line in muted text: `News · 1 day ago` / `Announcement · Oct 27, 2026`
- bold title, wrapping to 2-3 lines
- muted excerpt, about 3 lines, ending in an ellipsis
- author row: small round avatar + display name

## Where things are today

- `FeedView` renders `CardsRow` (`@tahti-player/ui`) with narrow boxed cards:
  `w-[calc(100vw-5rem)] max-w-80 sm:w-[calc((100vw-5rem)/3)]`, a bordered
  `bg-background-secondary` box with a primary glow. Standalone `/feed` is
  capped at `max-w-3xl`; embedded in `ListenView` (tab `feed`).
- Feed items: `FeedItem` in `api/types.ts` (`post` | `track` | `release`),
  loaded by `fetchFeed()` in `api/listen.ts` from `GET /api/me/feed`
  (followed artists only).
- tahti-org `apps/api/src/routes/me/feed.ts` already sends post `images`,
  `linkUrl`, `linkLabel` and `url`; the web `FeedItem` type drops them.
- Posts are `ArtistPost` (tahti-org schema): `title?`, `body`, `images[]`,
  `linkUrl`, `linkLabel`, `publishAt`. No category (News / Announcement), and
  no public all-artists endpoint (only `/api/channels/:slug/posts` per
  channel and `/api/me/posts` for the author).
- Discover widgets: `WidgetCard` in a `Masonry` (1/2/3 columns); news feeds
  render full width above it.

## Plan

### Phase 1 - wider feed cards (tahti-web + ui only)

1. `StoryCard` in `@tahti-player/ui` (+ Storybook): `ImageReveal` 16:9
   `rounded-xl`, meta line, `line-clamp-3` title, `line-clamp-3` excerpt,
   author avatar + name, the whole card is one link. No image: a theme
   gradient with the artist avatar, never an empty grey box. Props take a
   display name only (never an email; fall back to username).
2. `StoryRow` in `@tahti-player/ui`: header title + round prev / next icon
   buttons (scroll by one page with scroll snap), cards 85% wide on phones
   (next card peeks), 2 per view at `md`, 3 at `xl`. Either extend
   `CardsRow` with a `variant="stories"` or add a sibling. `CardsRow` keeps
   its filter for the boxed variant.
3. `FeedView`: drop the boxed glow cards and the `max-w-3xl` cap; render
   `StoryRow` full width. Map items:
   - post → image `images[0]`, meta `Post · <relative time>`, title, body
     excerpt, author
   - release → artwork, `Release · <type>`, title, artist
   - track → banner, `Track`, title, artist, play button on the image
   Add `images`, `linkUrl`, `linkLabel` to the web `FeedItem` post type and
   mock data.
4. Relative time ("1 day ago", then a date after a week): reuse the existing
   helper if there is one, else add one in `lib/`.
5. Stories: `StoryCard` (image / no image / long title / long excerpt),
   `StoryRow` (3-up, phone, loading, empty), `FeedView` wide. Update
   `docs/VIEW-CATALOG.md`.

### Phase 2 - community stories API (tahti-org, needs go-ahead)

1. `GET /api/v1/community/stories?cursor=&limit=` (public, cached briefly):
   published `ArtistPost`s (`publishAt <= now`) from every non-suspended,
   non-hidden artist, newest first, with author `{ username, displayName,
   avatarUrl }` (display name through `safeDisplayName`), `title`, an
   excerpt, `images`, `publishAt`, `url`.
2. Optional `ArtistPost.category` enum `STORY | NEWS | ANNOUNCEMENT`
   (default `STORY`) + a picker in Studio → Updates `PostDialog`, so the meta
   line can say News / Announcement as in the reference.
3. OpenAPI + `@tahti/api-client` regeneration; tests for suspended / hidden
   authors, scheduled posts and pagination.

### Phase 3 - Community stories widget (tahti-web)

1. `fetchCommunityStories()` in `api/` with a mock.
2. New Discover widget id `community-stories` in `discoverStore` /
   `widgetMeta.ts` (label "Community stories", in the Add a widget menu).
   It is a wide carousel, so it renders full width above the `Masonry`
   columns (like news feeds), not inside a column.
3. Uses `StoryRow` + `StoryCard`; loading / empty / error states via
   `PageStates`; signed-out visitors see it too.
4. Stories: `CommunityStoriesWidget` (filled, empty, error) and a
   `DiscoverView` story with the widget enabled.

## Progress

- 2026-10-30: Phase 1 and Phase 3 built in tahti-web against a mock matching
  the Phase 2 contract (`StoryCard`, `StoryRow`, wide `FeedView`,
  `CommunityStoriesWidget`, Studio post Type picker). Phase 2 is a tahti-org
  PR. Left: merge + deploy the tahti-org PR, then check the widget and the
  post Type on the real API.

## Decisions (2026-10-30)

- Build the tahti-org endpoint (Phase 2.1) on a branch with a PR; no merge
  or deploy without the user.
- Add `ArtistPost.category` (`STORY | NEWS | ANNOUNCEMENT`, default `STORY`)
  with a Studio picker (Phase 2.2).
- Community stories is a Discover widget only; My feed stays followed
  artists.
- Profile "Your story" text is not included (posts only).
