# Design audit: Studio and Admin

**Status:** open

## Request

Do a design audit of the Studio and Admin parts. Find crowded views and views with too much mixed context, for example chat-related parts spread over several places instead of in one. Split views that are too long into tabs.

## Scope

- Studio: `packages/tahti-web/src/views/studio/` (Home, Channel, Profile, Fans, Go live / Green room, Broadcast, Releases, Collections, Events, Listening parties, Groups, Distribution, Stats, Mastering, Editor).
- Admin: `packages/tahti-web/src/views/admin/` (Dashboard, Users, Radio, Streams, Moderation, News, Announcements, Financial, Governance, Storage, Monitoring...).
- Nav sources: `StudioNav.tsx` (`SUBMENUS`, `*_SUBNAV_ITEMS`), `AdminNav.tsx` (`ADMIN_SECTIONS`), `docs/NAVIGATION-SITEMAP.md`.

## To do

- [ ] Walk every Studio and Admin view (Storybook + local app), note per view: crowded / mixed context / too long / fine.
- [ ] Chat: list every place chat lives (start with `StudioFansView`, `StudioChannelView`, `StudioProfileView`, `go-live/GreenRoomSessionPanel`, admin `CommunityStatsPanel`) and propose one home, linking to it from the others.
- [ ] Long views: propose a tab split (`Tabs` from `@tahti-player/ui`, tab in the URL search like `radioTabs`), one slice per view.
- [ ] Write findings here as a table (view, problem, proposed fix), then split the fixes into slice todos.

## Related

- [navigation-simplification.md](navigation-simplification.md), [simplify-studio-library-settings-admin.md](simplify-studio-library-settings-admin.md), [ui-nav-audit.md](ui-nav-audit.md) - check them first so the audit does not repeat their findings.
