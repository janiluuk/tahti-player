# Channel Designer: gallery "+" tile replaces always-visible drop zone

**Status:** done (2026-09-05). Most of what was asked already existed.

## What was already there

Investigated `ChannelDesigner.tsx`'s gallery/slideshow section before
touching anything: **hover-reveal delete** (`Trash2Icon`, opacity-0 →
opacity-100 on `group-hover`) and **drag-and-drop reordering**
(`draggable`, `onDragStart`/`onDragOver`/`onDrop`,
`reorderGalleryImage`) were both already fully implemented on each
thumbnail. Only two things were missing from the request: a compact
"+" tile (there was instead an always-visible, full-width `FilePicker`
drop zone above the grid) and a modal for adding images (the picker was
inline, not in a dialog), and a visible drag-handle affordance on
hover (reordering worked by dragging the whole tile, with no dedicated
grip icon indicating that).

## What shipped

- Replaced the standalone `<FilePicker>` drop zone with a dashed "+"
  tile (`PlusIcon`) inside the same thumbnail grid as the existing
  images — same size/shape as the other tiles, opens a `Dialog.Root`
  containing the same `FilePicker` (unchanged upload logic,
  `selectGalleryFiles`) when clicked. The dialog closes automatically
  once the upload finishes.
- Added a small hover-reveal grip icon (`GripVerticalIcon`, top-left of
  each thumbnail, matching the existing delete button's hover-reveal
  pattern at top-right) as a visual affordance that the tile is
  draggable — the drag behavior itself was already there, this only
  adds the indicator.
- The empty-state caption ("Upload images to build the slideshow
  behind your channel.") now shows below the grid (which always
  contains at least the "+" tile) instead of replacing the grid
  entirely when there are zero images.

## Verification

`tsc --noEmit`, `eslint`, and `pnpm --filter @tahti-player/tahti-web
build` all pass. No existing test file for `ChannelDesigner.tsx`; none
added. Not manually verified in a running browser — worth confirming
the modal-based add flow and the new grip icon read clearly.
