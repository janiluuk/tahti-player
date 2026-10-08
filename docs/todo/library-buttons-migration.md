# Library `Button` everywhere in tahti-web

**Status:** partial

`CLAUDE.md` says tahti-web UI must use `@tahti-player/ui` components, with no hand-rolled `<button>` where a library component covers the case. A count on 2026-10-08 found 70 raw `<button>` elements in `packages/tahti-web/src` (tests and stories left out).

## Done (2026-10-08)

- The listener pages (#563): Discover, News, the artist directory, the top search results, the phone tab bar and player bar, the channel stage and backdrop nav, the track dialog's tracklist, embed rows, "Manage widgets", the page tour and radio station covers. The phone player bar cover is a `MediaArtwork`.

## Done (2026-10-08, second pass)

- `Button` has a `plain` variant for converted buttons that carry their own classes (#582).
- Channel Designer and theme editor (#582), Studio editors (#583), image and release controls (#584), radio booking and admin (#585), the map pages (#586), page header artwork controls (#594): 55 buttons.
- Six buttons that were nested inside a `Link` are `ButtonLink` (#593).

## Left

- [ ] Decide: the drawer scrim in `MobileChrome` is a full-screen `<button>`; a library `Button` does not obviously cover it. It is the last raw `<button>` in `packages/tahti-web/src`.
- [ ] Three `Link` → `Tooltip` → `Button` nestings remain in `track-edit-dialog/AudioTab.tsx` (2) and `PurchaseAccessSection.tsx`. Their tests mock `Link` without a router, and `ButtonLink` needs one; give the tests a router first.

## Notes for whoever continues

- Use `variant="plain" size="flexible"` and keep the original classes. A converted button with its own selected background must not use `variant="text"`: that variant's hover tint replaces the background while hovering.
- `Button` adds `whitespace-nowrap`, `rounded-md`, `active:scale-95`, `disabled:opacity-50` and, for `variant="text"`, `hover:bg-black/5`. Row-like buttons need `rounded-none` or `hover:bg-transparent`, and a row that is disabled without looking it needs `disabled:opacity-100`.
- `Button` forwards its ref as `HTMLElement`, so a `useRef<HTMLButtonElement>` passed to it must be widened.
- Count again with `grep -rc --include=*.tsx -E '<button\b' packages/tahti-web/src`.
