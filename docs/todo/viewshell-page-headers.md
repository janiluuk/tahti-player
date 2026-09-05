# ViewShell page headers (Studio, Admin, listener)

**Status:** partial

## Remaining

cover-overlay entity headers excluded
headers remain open — see Order of work below. Everything else in this
doc's Listener/Studio/Admin scope is converted (round-4 batches
2026-09-04, docs/todo/HISTORY.md).

**2026-09-05:** verified and converted Pro Editor. There is no runtime
"maximized" chrome toggle anywhere in `StudioProEditorView.tsx` — the
`Maximize2Icon` in its toolbar is "Reset zoom" on the waveform, unrelated.
The "Leave" list's "Maximized Pro Editor" exclusion doesn't apply to this
view; it's an ordinary plain-text `StudioPageHeader`, now `ViewShell`
(`classes={{ root: 'px-0 pt-0' }}`), matching every other Studio list
page. Breadcrumb links (← Music / Metadata / Projects / Mastering) stay
outside `ViewShell`, same as `StudioEditorProjectView`'s `← Editor` link.
The render-prompt `Dialog.Root` and the hidden `<audio>` element stay
siblings after `</ViewShell>`, also matching that file's dialog placement.
**Storybook:** `Components/ViewShell` — `title` + `subtitle` strings, then `ScrollableArea`.
**Today:** listener pages use `PageHeader` (title, rich subtitle, meta, actions, back). Studio and Admin use `StudioPageHeader` (title, long subtitle, action). Converted to `ViewShell`: News / What’s New, Listen, Discover, Help hub, Radio, Radio schedule, History, Feed, Favorites, Account, Messages, Status, Chat, MoreView, TransparencyView, TransparencyMethodologyView, TransparencyGrantYearView, LegalDocShell (all legal pages), PublicGovernanceHistoryView, VenueRegisterView, OnboardingView, GreenRoomView, SubscribeView, Studio Home / Sounds / Collections / Playlists / Upload / Schedule / Go Live / Releases / Stats / Shows / Stash / Recordings / Events / Channel / Revenue / Editor list, Library overview + catalog tabs, and Admin Dashboard / Users / Streams / Content / Selects / Status.

## Contract

Use Nuclear `ViewShell` as the page frame on ordinary chrome surfaces (Listen, Radio, Discover, Studio, Admin, Settings-adjacent Help, Library, member governance).

- **Title** — page name only (`Listen`, `Sounds`, `Dashboard`). Not greetings, counts, or status chips.
- **Subtitle** — one short line. Not button docs, API jargon, or multi-clause essays. Drop it when the title is enough.
- **Actions** — not in the header. First row of `children` (`Button` / `SaveButton`). `ViewShell` has no action slot.
- **Back** — first child, not a header prop.
- **Persistent chrome stays outside** `ViewShell`: `StudioNav`, `AdminPageLayout` tabs, Listen section `Tabs`. Do not put those inside the scroll area.
- **Do not double-pad.** `AppShell` already applies `MAIN_CONTENT_PADDING` (`p-6`). Nested `ViewShell` must use `classes={{ root: 'px-0 pt-0' }}` until AppShell padding is lifted for these routes. Do not stack `px-6` twice.

Copy examples:

| Page | Today | Target title | Target subtitle |
| --- | --- | --- | --- |
| Listen | “Discover community artists — your library is one tab over.” + action cluster | Listen | Community artists and radio. |
| Studio home | Greeting + role badges in `action` | Studio | Greeting can be the subtitle; badges move into children. |
| Sounds | “Your sounds and other files, in one place.” + upload action | Sounds | Your files. Upload stays a child `Button`. |
| Admin dashboard | “Operations dashboard — members, live streams, and system health.” | Dashboard | Members, live streams, and health. |
| Admin streams | Subtitle explains Restart/Skip/Pause | Streams | Live channels. Control copy moves to `Tooltip` on those icon buttons. |
| Admin orphan pages | Two-sentence explanation | Orphan pages | Pages with no menu entry. |

## Leave (not ViewShell)

Persistent-chrome rule and take-over canvases:

- Full-screen player
- Public release / share canvases (`SmartLinkView`)
- Maximized Pro Editor
- Public channel / artist hero (cover + `Box` / `StatChip`, not a list-page title)
- Settings modal (not a route page)
- `StudioPanel` section titles inside a page
- Entity edit headers that are a cover + chips (album / collection / track) — separate Box sweep

`PageHeader` / `StudioPageHeader` stay only until each surface is converted, then drop the aliases.

## Listener

Replace `PageHeader` + `PageFrame` on list/hub pages. Keep Listen/Discover/Radio section tabs **above** or as the first children, not as a second `<h1>`.

Convert:

- Listen (`ListenView` — title Listen; widget-store / What is tahti.live → child actions)
- Feed, Favorites, History
- Discover
- Radio, Radio schedule, Radio show (show detail may keep a richer entity header)
- Help hub + article
- Account, Messages, Chat
- Governance + public history + feature requests
- Status, More/map, Transparency (+ methodology, grant year)
- Legal shells that are document pages (`LegalDocShell`) — title + short meta as subtitle
- Onboarding, What is it, Subscribe, Green room, Venue register / detail (list-like)
- News / What’s New already use `ViewShell`; shorten titles if needed

Leave listener entity canvases: `ChannelView` hero, `ArtistView` header, `CollectionView` cover block, `SmartLinkView`.

## Studio (+ Library under Studio)

`StudioNav` stays mounted. `ViewShell` is the pane under it. Move header `action` (New, Upload, Add) into children.

Convert every `StudioPageHeader`:

- ~~Home, Go Live, Schedule, Stats + detail~~
- ~~Sounds, Collections edit list header, Releases~~ — `Sound detail`,
  `Collection edit` and `Release detail` themselves keep their cover-image
  overlay header (see "Leave" / Order-of-work item 4), only their list
  pages converted.
- ~~Playlists, Upload, Stash, Recordings, Media (Library tabs), Library
  smart links~~
- ~~Shows list, Events + create, Updates~~ — `Show detail` keeps its cover
  overlay header, same carve-out as Sound/Release/Collection detail.
- ~~Channel, Branding, Distribution, Revenue, Stripe~~
- ~~Editor list + project, Pro Editor~~ — no maximized-chrome state
  exists for Pro Editor; converted 2026-09-05.
- ~~Mastering, Track insights, Governance, Moderation~~
- Venues — Studio has no separate Venues page found under
  `views/studio/**`; only `AdminVenuesView` existed and is done.

Studio home: title `Studio`; greeting as subtitle; role/member `Badge`s as children, not header actions.

## Admin

`AdminPageLayout` tabs stay outside `ViewShell`. Convert every `StudioPageHeader` on board pages:

- ~~Dashboard, Users, Content, Streams, Selects, Status~~
- ~~Storage + user, Radio, Activity, Logs~~
- ~~Financial, Grants + cycle, Governance, AGM, Reports~~
- ~~Venues, I18n, Moderation, Artwork presets, Disco-widgets~~
- ~~Vendors (dashboard tab content)~~
- Admin fully converted (2026-09-04) — see `docs/todo/HISTORY.md`. News,
  Announcements, and Top lists/Orphan pages were re-checked and either
  already used `ViewShell` or don't exist as separate `StudioPageHeader`
  consumers under those exact names — nothing left in `views/admin/**`.

Shorten the current paragraph-subtitles (streams, artwork presets, storage, activity auto-refresh) to one line; move how-to copy onto control `Tooltip`s.

## Storybook

- Add `ViewShell` states: title only, title + subtitle, no title (content only).
- Flag `Tahti/Page/PageHeader` and `StudioPageHeader` as superseded for list pages (`Orphan:` once unused).
- Update `Tahti/Reference/Element locations`: list pages → `ViewShell`; entity covers stay `PageHeader`/`Box` until that sweep.
- After each area lands, the matching view stories should show `ViewShell` title/subtitle, not a second local `<h1>`.

## Order of work

1. Storybook states + padding rule (`classes.root` vs AppShell).
2. ~~Listener hubs (Listen, Discover, Radio, Help, History, Radio schedule, Feed, Favorites, Account, Messages, Status, Chat, More/map, Transparency + methodology/grant-year, Legal, Governance, Venues, Onboarding, Subscribe, Green room)~~ — listener bucket done.
3. ~~Studio Home, Sounds, Collections, Playlists, Upload, Schedule, Go Live, Releases, Stats, Shows, Library tabs, Stash, Recordings, Events, Channel, Revenue, Editor list, Editor project, Mastering, Track insights, Governance, Moderation, Branding, Distribution, Stripe, Events create, Library smart links~~ — every plain title/subtitle/action `StudioPageHeader` in Studio done (2026-09-04).
4. Remaining Studio: only entity-detail headers that are a cover image + chips overlay, out of scope for this contract per "Leave" above — `StudioSoundView`, `StudioReleaseDetailView`, `StudioShowDetailView`, `StudioCollectionEditView`. These need the separate Box/cover-header sweep the doc already calls out, not a `ViewShell` swap. (`StudioProEditorView` converted 2026-09-05 — it was never actually one of these, see status note above.)
5. ~~Admin~~ — all 18 board pages done (2026-09-04): Dashboard, Users, Streams, Content, Selects, Status, Storage + user, Radio, Activity, Logs, Financial, Grants + cycle, Governance, AGM, Reports, Venues, I18n, Moderation, Artwork presets, Disco-widgets, Vendors, plus News/Announcements/Top lists/Orphan pages (already `ViewShell` from other work).
6. Delete or narrow `StudioPageHeader`: only `StudioPanel.tsx` (the definition) and the 4 excluded cover-overlay Studio views (item 4) still import it. Safe to narrow its usage note once those are resolved, not yet safe to delete the component.

Do not hide `StudioNav` / Admin tabs / Listen tabs during the swap.
