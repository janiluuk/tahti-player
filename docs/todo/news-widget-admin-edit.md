# News widget - admin edit icon and modal on every item

**Status:** open

## Request

For all news widget items, let an admin edit them in a modal, and show an edit icon on each news item for admin users.

## What exists

- `packages/tahti-web/src/components/LatestNewsWidget.tsx` renders the Latest News widget (Listen + Feed) from Tahti platform posts plus the listener's RSS sources.
- `PlatformNewsDialog.tsx` already edits a Tahti platform post (`updateNewsPost` in `api/admin`), but only from inside the opened article dialog, and only for `hasAccountRole(user, 'BOARD')`.
- RSS items open in `NewsArticleDialog.tsx`; they come from outside feeds and have no Tahti-side record to edit.

## To do

- [ ] Show an edit icon (`EditIconButton`) on each platform news item in the widget list and the "More news" dialog for admins, opening the edit modal directly.
- [ ] Reuse the `PlatformNewsDialog` edit form (or split it out) so list and article dialog share one modal.
- [ ] Storybook + tests: admin sees the icon, a non-admin does not, saving updates the item in the list.

## Open questions

- "Admin": `ADMIN` only, or keep the current `BOARD` gate used by `PlatformNewsDialog`?
- RSS items: hide the icon (not editable), or allow a local override (title / image) stored on Tahti?
