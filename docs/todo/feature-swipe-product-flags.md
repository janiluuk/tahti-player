# Feature swipe — remaining product flags

**Status:** partial

Product call landed (2026-10-19):

| Gap | Decision | Status |
| --- | --- | --- |
| `/studio/distribution` as StudioNav sibling | Add Distribution next to Releases | Shipping |
| `/chat` hub in chrome | Sidebar footer + phone More (not primary bar) | Shipping |
| Mobile bottom nav Favorites / Library / Help | Keep under More | Already true — no change |

## Plan

1. `SUBMENUS` + `studio.distribution` i18n; stop folding `/studio/distribution` under Releases.
2. Chat `SidebarNavigationItem` in AppShell footer; `navigationActive` lights `chat` + More.
3. Help + draft nav store + tests; bump tahti-web.
4. Fold this todo when PR merges.
