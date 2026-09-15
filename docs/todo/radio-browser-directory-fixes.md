# Radio Browser directory: layout, cover images, enable flow

**Status:** partial
live session check, not a code change.

## Located

The "Radio Browser directory" lives in `PluginStorePanel.tsx`'s
`RadioBrowserDirectoryCard` (Settings → Add-ons → Radio), not a
dedicated view file.

## Shipped

1. **Genre chips collapsed by default.** Was an always-expanded
   `FilterChips` grid; now behind an "All genres" text toggle. Stays
   expanded automatically if any genres are already selected, so active
   filters are never hidden.
2. **Search bar + button merged.** The standalone "Search" button below
   the filters is gone; the search `Input` now has a search-icon
   `endAddon` button (matches the `Input` component's own addon
   pattern, styled as a clickable segment inside the input's border).
3. **Stations tab is now first/default.** Swapped the `Tabs` items
   array order (Stations, then Browser) — `Tabs` picks its first item
   by default, so this also makes it the default without a separate
   `defaultIndex`.
4. **Enable control is now an icon button.** The "Enable"/"Enabled"
   text `SaveButton` on each Finnish station row is now an icon-only
   `PowerIcon` button (`Tooltip` + `aria-label` + `aria-pressed`),
   matching the convention established earlier today on the Audio tools
   category.
5. **Enabled stations sort to the top.** `curatedStations` (the Finnish
   stations list) now sorts enabled stations first (stable sort —
   ties keep their catalog order), so enabling a station moves it up
   instead of leaving it wherever it was in the fixed list.
6. **Removed "Changes are saved for this add-on."** This was
   `ConfigurableCard`'s own generic `Dialog.Description`, shared by
   *every* configurable add-on's settings modal (not Radio-Browser-
   specific) — dropped it, matching today's broader pattern of removing
   low-value permanent captions.

## Station cover images: edit gate is a permission check, not a bug — redesigned to match the app's shared pattern

Investigated: `RadioStationCover` (used in the Finnish stations row)
already has edit capability built in — it renders
`RadioStationCoverEditButton` internally, gated on
`canEditRadioStationCover(user)`, which is `hasAccountRole(user,
'BOARD')` (exact role match, with its own test coverage). This is a
deliberate, tested permission gate, not obviously a bug.

**2026-09-15:** The edit affordance itself was still a full-area overlay
button with no room for hover-delete-X + click-to-preview — redesigned
to a small corner control (matching `RoundImageUploadButton`/
`BackdropUploadButton`'s pattern): the whole cover is now a click target
that opens a large preview (`ImageSlotPreviewDialog`, new `hideDelete`
prop since a station cover has no "empty" state to clear to), with
"Change" reusing the existing upload flow via a small imperative
`onRegisterOpenPicker` handoff (the edit button owns the file input).
Same `data-testid`s, same `aria-label`s, existing test suite still
green plus a new case pinning "Change" present / "Delete" absent in the
preview. See `docs/todo/image-upload-hover-lightbox.md`'s matching entry
— both todos hit this same blocker.

**Still open:** if the logged-in account really is a BOARD-role account
and covers still can't be edited, the bug is elsewhere (a role-detection
issue, not this gate) — needs checking against an actual live session,
not a guess.

## Not attempted: "scrape [station artwork] to production"

Explicitly out of scope per the original queue note — this is a
data/content task (fetching real station artwork and pushing it to the
production database), not a UI change, and needs its own scoping
(image source, which stations, prod DB access) before attempting.

## Verification

`tsc --noEmit`, `eslint`, `pnpm --filter @tahti-player/tahti-web test`
(467 tests, all passing), and `pnpm --filter @tahti-player/tahti-web
build` all pass. No test file exists for `PluginStorePanel.tsx`; none
added. Not manually verified in a running browser.
