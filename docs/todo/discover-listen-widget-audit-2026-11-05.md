# Discover / Listen widget audit (2026-11-05)

**Status:** open

Mock app (`VITE_FORCE_MOCK=1`), every Discover widget enabled, signed in and
out, 1440×900 and 390×844. Automated checks came back clean: no horizontal
page scroll, no raw i18n keys, no unnamed buttons or links, no broken images,
no console errors except CORS on the mock's external radio/audio URLs. The
findings below come from reading the screenshots.

## Default artwork rule broken
- Random artist of the week, Latest releases, Public playlists and the story dialog author: fixed in #1854 (`MediaArtwork` with a seed).
- [ ] Feed cards: a letter placeholder ("M") or an avatar image sits in the middle of the card, behind the title text (Thursday show, Thank you 15000+).

## Inconsistent
- [ ] Two near-identical widgets, "Random artist of the week" and "Random artist pick": same layout, same button, confusing names.
- [ ] Widget headings are 14px on Discover; section headings are 18px on Listen and on Discover's own "From Tahti".
- [ ] Listen sections each get a coloured pill that repeats the title (Internet radio green, Curated orange, Releases teal, Live olive, Top plays pink, Events green): six colours, no meaning.
- [ ] Carousel arrows: square orange filled on Listen/Discover, round outlined on Feed.
- [ ] Filters: desktop Listen has a filter field only on Tahti Selects, but on phone Radio and Coming up get "Filter stations…/Filter events…" too. Discover has global Genres/Types plus a separate "All genres" chip in Random track (lime green, matches no other chip).
- [ ] Three search box styles: Artists (labelled panel), Groups (bare field with icon), top bar.
- [ ] Card styles differ between Discover tabs: Artists use thick neo-brutalist tiles, Groups thin rounded rows with small "Request to join" pills, Venues a plain bordered box.
- [ ] "New tracks" on Listen has a left accent bar, no pill, and is wrapped in a panel with "9 tracks". No other section looks like that.
- [ ] Ranking: Trending puts the rank in the title ("1. Aurora Drift"); Discover widgets use a rank column.
- [ ] Customising: Listen uses two unlabeled icon buttons in the header (reorder, add); Discover uses up/down/close on each widget.

## Unstyled
- [ ] Discover → Venues: "Register a venue" and "My venues" are plain text with no button or link style; the venue card has no artwork, and "View venue →" is small grey text. The mock description "Mock venue for the listen POC." shows.
- [ ] Listen community guidelines banner: the title is in a blue link colour that is outside the theme palette.

## Crowded / clipped
- [ ] Phone Discover: the tab row wraps (Groups and Venues drop to a second line), "From Tahti" wraps beside its pill, and the news carousel's next arrow is cut off at the right edge.
- [ ] Phone widget titles are truncated ("Loved by the communi…", "Random artist of the w…"); so is the Tahti Selects subtitle on desktop too ("Picked for the Tahti Selects ro…").
- [ ] Artists tab: 17 genre chips, each "(1)", fill two lines above the results.
- [ ] Coming up cards clip the venue ("Ääniwalli, Helsin") and the title ("Late-night broadcast …").
- [ ] Discover masonry leaves empty blocks: Latest releases (one item, 280px box), Public playlists, and a blank area above Random track in column 3. Listen's New releases, Live now and Coming up show one or two cards in a full-width row.

## Navigation
- Fixed in #1880: the Tahti map and flow diagrams name `/discover?tab=feed` and `/library/favorites` instead of the old `/listen/feed` and `/listen/favorites` redirects; search results light no nav item; the phone tab bar reads Listen, Radio, Discover like the sidebar; each Discover tab has its own h1.
- [ ] "Live now" cards repeat "Live now" as the subtitle and show no live marker on the art.
