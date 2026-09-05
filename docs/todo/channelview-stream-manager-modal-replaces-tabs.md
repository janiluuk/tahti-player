# ChannelView: Stream Manager modal replaces Overview/Manage tabs

**Status:** done (2026-09-05).

## What shipped

`ChannelView.tsx` previously wrapped the owner/admin's channel page in a
top-level `Tabs.Root` ("Overview" / "Manage") — switching to "Manage"
replaced the entire page body with a "Command center"/"Stream manager"
section rendering `StreamManagerPanel` inline, `defaultExpanded`. This
was also the same tab strip flagged as unclear in an earlier session
pass (`docs/todo/channelview-badge-dedup-and-share-modal.md`'s "move the
player above the tabs" item) — this task supersedes that with an
explicit, unambiguous instruction instead: drop the tabs, add a Stream
Manager icon to the channel's own toolbar (next to Edit design / Share,
"in the profile"), and open the control center in a modal instead of
switching the whole page away.

- Removed `channelTab` state, the `Tabs.Root`/`Tabs.List`/`Tabs.Tab`
  strip, and the separate "Command center"/"Stream manager" section
  with its own `PageHeader`. Owner/admin now always see `pageBody`
  directly (same as any other visitor), matching the non-owner code
  path exactly.
- Added a `ListMusicIcon` "Open Stream Manager" icon button
  (`Tooltip` + `aria-label`) to the toolbar, gated on
  `isOwner || isAdministrator` — the same set of people who used to see
  the "Manage" tab.
- Clicking it opens `StreamManagerPanel` in a `Dialog.Root` modal
  (`max-w-xl`), **without** `defaultExpanded` — "collapsed to minimal
  version" per the request, so it opens showing just the compact
  header/stats first.
- Removed now-unused imports: `LayoutDashboardIcon`, `Settings2Icon`,
  `TabLabel`, `Tabs` (from `@tahti-player/ui`), `PageHeader`.

## Verification

`tsc --noEmit`, `eslint`, `pnpm --filter @tahti-player/tahti-web test`
(467 tests, all passing — no test exercised the removed tab strip
directly), and `pnpm --filter @tahti-player/tahti-web build` all pass.
Not manually verified in a running browser.
