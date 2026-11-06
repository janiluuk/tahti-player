# Discover / Listen widget audit (2026-11-05)

**Status:** open

Mock app (`VITE_FORCE_MOCK=1`), every Discover widget enabled, signed in and
out, 1440×900 and 390×844. Automated checks came back clean: no horizontal
page scroll, no raw i18n keys, no unnamed buttons or links, no broken images,
no console errors except CORS on the mock's external radio/audio URLs. The
findings below come from reading the screenshots.

## Default artwork rule broken
- Random artist of the week, Latest releases, Public playlists and the story dialog author: fixed in #1854 (`MediaArtwork` with a seed).
- Feed cards: fixed (`StoryCard` and Feed track/release media show seeded default artwork, no letter or avatar cover).

## Inconsistent
- [ ] Two near-identical widgets, "Random artist of the week" and "Random artist pick": same layout, same button, confusing names.
- Widget headings: fixed (Discover `WidgetCard` uses the 18px bold section heading).
- [ ] Listen sections each get a coloured pill that repeats the title (Internet radio green, Curated orange, Releases teal, Live olive, Top plays pink, Events green): six colours, no meaning.
- Carousel arrows: fixed (`StoryRow` uses the square `noShadow` buttons from `CardsRow`).
- [ ] Filters: desktop Listen has a filter field only on Tahti Selects, but on phone Radio and Coming up get "Filter stations…/Filter events…" too. Discover has global Genres/Types plus a separate "All genres" chip in Random track (lime green, matches no other chip).
- [ ] Three search box styles: Artists (labelled panel), Groups (bare field with icon), top bar.
- [ ] Card styles differ between Discover tabs: Artists use thick neo-brutalist tiles, Groups thin rounded rows with small "Request to join" pills, Venues a plain bordered box.
- [ ] "New tracks" on Listen has a left accent bar, no pill, and is wrapped in a panel with "9 tracks". No other section looks like that.
- Ranking: fixed (Trending shows the rank as a pill on the artwork, not in the title).
- [ ] Customising: Listen uses two unlabeled icon buttons in the header (reorder, add); Discover uses up/down/close on each widget.

## Unstyled
- Discover → Venues: fixed (Register a venue / My venues / View venue are button links, venue cards show seeded default artwork, realistic mock description).
- Listen community guidelines banner: fixed (neutral theme colours with a primary icon).

## Crowded / clipped
- Phone Discover: fixed (tab row scrolls on one line, `NewsWidget` keeps the title on one line and wraps its controls below).
- Widget title truncation: fixed (titles and subtitles wrap to two lines).
- [ ] Artists tab: 17 genre chips, each "(1)", fill two lines above the results.
- Coming up clipping: fixed (title and venue wrap to two lines, venue on its own line).
- [ ] Discover masonry leaves empty blocks: Latest releases (one item, 280px box), Public playlists, and a blank area above Random track in column 3. Listen's New releases, Live now and Coming up show one or two cards in a full-width row.

## Navigation
- [ ] `/listen/feed` lands on Discover → Feed and `/listen/favorites` on Library → Favorites, so the highlighted nav item changes away from Listen.
- [ ] Search results highlight Listen in the nav.
- [ ] Item order differs: the sidebar is Listen, Radio, Discover; the phone tab bar is Listen, Discover, Radio, Studio, More (Library only under More).
- [ ] Every Discover tab keeps the h1 "Discover" (Feed, Artists, Groups, Venues have no title of their own); Listen → History changes its h1.
- "Live now" cards: fixed (live / replay pill on the artwork, `@username` subtitle).
