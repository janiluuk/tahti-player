# Studio usability for artists — stats, bulk actions, search, quick actions

**Status:** partial

2026-10-19 sweep of `packages/tahti-web/src/views/studio/` after the user flagged "more
usability for artists needed". The first round shipped on 2026-10-19 (see HISTORY:
per-release Stats tab, top lists → Insights, release track rows → insights/editor, Shows
search, bulk add-to-playlist on Sounds, Collections row menu, create/schedule errors as
toasts, dead `MyDiscographyView` removed).

## Left

Batch 75 shipped the release-row Stats shortcut, create errors as toasts, a load-failure
state on Releases / Collections / Sounds, and Play on collection rows (see HISTORY).

1. **Delete a release:** blocked on the API — tahti-org has no `DELETE` for a release
   (only artwork and tracks). Needs a tahti-org route first.
2. **Bulk selection, second action:** add-to-release from a Sounds selection (releases
   build their tracklist through their own flow; needs a picker).
3. **Undo** for publish/create flows (none anywhere in Studio).

## Verify

- Storybook for new panels (story-first per AGENTS).
- `pnpm --filter @tahti-player/tahti-web type-check && lint && test`.
- Studio nav flows re-checked in the three governance contexts where chrome differs.
