# Studio usability for artists — stats, bulk actions, search, quick actions

**Status:** partial

2026-10-19 sweep of `packages/tahti-web/src/views/studio/` after the user flagged "more
usability for artists needed". The first round shipped on 2026-10-19 (see HISTORY:
per-release Stats tab, top lists → Insights, release track rows → insights/editor, Shows
search, bulk add-to-playlist on Sounds, Collections row menu, create/schedule errors as
toasts, dead `MyDiscographyView` removed).

## Left

Most of what is left lives in `StudioReleasesView.tsx`, which the UX sweep
(`ux-sweep-30-slices.md`, slice 30: release search) is editing — do these after it lands.

1. **Release rows:** a stats shortcut to the release's `?tab=stats`, and a delete-release
   action (create + pin only today, `ReleasePinButton.tsx`).
2. **Releases feedback drift:** `StudioReleasesView.tsx` still prints create errors in an
   inline `msg` paragraph; release-create failure blocks the success confirmation.
3. **Bulk selection, second action:** add-to-release from a Sounds selection (releases
   build their tracklist through their own flow; needs a picker).
4. **Collections row play:** list rows carry no items, so playing a collection from the
   list needs a fetch-then-play helper.
5. **Undo** for publish/create flows (none anywhere in Studio).

## Verify

- Storybook for new panels (story-first per AGENTS).
- `pnpm --filter @tahti-player/tahti-web type-check && lint && test`.
- Studio nav flows re-checked in the three governance contexts where chrome differs.
