# Library Sounds: Embeds tab + thumbnails

**Status:** open  
**Updated:** 2026-11-10  
**Related:** [embed-thumbnails.md](embed-thumbnails.md) (folded into slices below)

Move Library → Embeds into **Library → Sounds** as a tab inside the Sounds
panel (`StudioPanel`), and fix missing embed provider thumbnails.

## Next 30 slices

| # | Repo | Slice | Done when |
| - | ---- | ----- | --------- |
| 1 | player | Sounds panel Tabs: `Sounds` \| `Embeds` | ✅ Tab strip in `StudioSoundsView` StudioPanel |
| 2 | player | Embeds tab renders `LibraryEmbedsView` | ✅ Same list/groups as old page |
| 3 | player | Deep link `?tab=embeds` on `/library/sounds` | ✅ URL selects Embeds tab |
| 4 | player | Redirect `/library/embeds` → `/library/sounds?tab=embeds` | ✅ Bookmark-safe |
| 5 | player | Remove top-level Library **Embeds** tab from `LIBRARY_SECTION_TABS` | ✅ Nav no longer lists it |
| 6 | player | Keep artist-only gate for Embeds content | ✅ Listeners still redirected off Sounds |
| 7 | player | i18n: Sounds panel tab labels (en + fi) | ✅ `library.soundsPanel*` keys |
| 8 | player | Storybook: Sounds with Embeds tab selected | Play asserts Embeds panel |
| 9 | player | E2E: `/library/embeds` redirect + Embeds tab | ✅ routes-library redirect |
| 10 | player | VIEW-CATALOG + user-manual Embeds path | ✅ VIEW-CATALOG updated |
| 11 | player | `EmbedTrackRow`: pass `bannerUrl` / cover into artwork | ✅ Thumb + play overlay |
| 12 | player | Map studio sound `bannerUrl` for embed providers in list | Sounds list thumbs for embeds |
| 13 | player | SoundCloud panel: use API `thumbnailUrl` when non-null | Panel cards show art |
| 14 | org | Persist cover on embed import (hearthis/mixcloud/spotify/bandcamp) | `bannerUrl` set on create |
| 15 | org | Backfill missing embed `bannerUrl` from provider oEmbed/OG | Worker or one-shot job |
| 16 | player | Client: if embed has no banner, fetch oEmbed thumbnail once | Soft fill without reload |
| 17 | player | Default artwork seed when no provider thumb | Never blank placeholder |
| 18 | player | Channel public Embeds tab uses same cover field | Channel page thumbs |
| 19 | player | Unit: EmbedTrackRow with bannerUrl | Assert MediaArtwork src |
| 20 | player | Unit: LibraryEmbedsView groups still work after move | Smoke test |
| 21 | player | Hide embed filter Select on Sounds tab (embeds live on Embeds tab) | Or keep + document |
| 22 | player | Sounds list default filter excludes pure embeds (optional) | Native tracks on Sounds tab |
| 23 | player | Empty Embeds tab CTA still opens import add-ons | Empty state intact |
| 24 | player | seo / documentLinks drop standalone Embeds title if unused | No dead title keys |
| 25 | player | Finnish batch for new Sounds/Embeds chrome | fi_FI keys |
| 26 | player | Admin ChannelTracksPanel: show embed thumbs if present | Same cover field |
| 27 | player | e2e journey: open Sounds → Embeds → play one embed | Mock app |
| 28 | player | Fold `embed-thumbnails.md` into this todo when thumbs fixed | Delete sibling todo |
| 29 | player | Strip finished checkboxes from WORKPLAN if listed | Hygiene |
| 30 | player | Harden: no blank thumbs in Storybook Missing states | Orphan/missing noted |

## Deferred

- iTunes / native desktop library embeds
- Provider-specific oEmbed rate limits / caching policy beyond first ship
