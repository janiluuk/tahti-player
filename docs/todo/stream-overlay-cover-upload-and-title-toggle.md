# Stream overlay: cover upload UX fix + "show title" toggle + preview

**Status:** done (2026-09-05).

## Background

Three user reports about `StreamOverlayEditor.tsx` (Manage → Multicast →
Overlay, and Go Live's Stream Manager Overlay tab):

1. Uploading a cover image showed "an empty thumbnail" — the component
   used a bare `FilePicker` dropzone (always visible, no ready
   placeholder) plus a conditional raw `<img>` above it, not the app's
   established upload-slot convention (see
   `packages/tahti-web/WORKPLAN.md`'s media-upload-convention entry).
2. Feature request: a "Show overlay title" toggle, default off, gating
   the title/subtitle fields' visibility, with a live preview of the text
   over the cover when enabled and non-empty.
3. Backend companion: the toggle needed a real persisted field so the
   *actual* RTMP mirror video frame respects it too, not just the editor
   UI — see the sibling `tahti` repo's PR #441
   (`docs/todo/stream-overlay-show-title-toggle.md` there).

## What shipped

- Cover slot rebuilt using this app's shared "image slot" primitives
  (`ImageSlotDeleteBadge`, `ImageSlotPreviewDialog`, `useImageSlotChrome`
  — the same ones `RoundImageUploadButton`/`BackdropUploadButton` use):
  ready `ImageIcon` placeholder when empty, hover reveals an upload-cloud
  icon (empty) or a corner delete badge (set), clicking an empty slot
  opens a `Dialog` with a `FilePicker` inside (uploads immediately on
  selection, closes on success), clicking a set slot opens the shared
  large-preview dialog with Change/Delete. Sized `aspect-video` (16:9),
  matching the *actual* composited frame — `buildRtmpMirrorOutput`
  stretches the cover to fill the full 1280×720 output, so this isn't a
  square album-art thumbnail like other cover slots in the app.
- "Show overlay title" `Toggle`, default off (matches the new
  `streamOverlayShowTitle` field, itself defaulting false). Title/subtitle
  `Input`s only render when it's on.
- `OverlayTextPreview`: a CSS overlay (bottom gradient scrim + white bold
  title + smaller light-gray subtitle) drawn directly on the cover slot,
  positioned to loosely mirror `buildRtmpMirrorOutput`'s real
  `video.add_text` placement (bottom-anchored, title above subtitle).
  Shown only when the toggle is on *and* at least one field has text —
  matches the toggle-gates-preview relationship the user asked for.
- `StreamOverlay` type (`api/broadcast.ts`) and its mock/fallback default
  objects gained `streamOverlayShowTitle: boolean`.

## Not done / deliberately out of scope (queued separately)

Queued in `docs/todo/queued-ux-fixes-2026-09-05.md`:
- Color picker for the overlay text + an opacity-scrim toggle (the
  preview's gradient scrim is currently unconditional — should become
  conditional on that future toggle).
- Default the cover placeholder to the currently-playing track's artwork
  instead of a bare icon; auto-fill title/subtitle from the current
  show's artist/title/tagline when the artist hasn't set custom ones
  (skip an empty tagline rather than rendering a blank subtitle line).
- Move the top explanatory paragraph ("RTMP has no built-in title
  metadata...") out of the form body and into the page's help layer —
  left in place for this pass since removing it without somewhere to put
  it would just delete the only explanation of what this feature does.
- No Storybook story added — this component wasn't in Storybook before
  this change either, and it depends on live `fetchStreamOverlay`/
  `uploadUserMediaFile` calls with no existing mock wiring for a story
  context.

## Verification

`tsc --noEmit`, `eslint` clean on `StreamOverlayEditor.tsx` and
`api/broadcast.ts`. `pnpm --filter @tahti-player/tahti-web build`
succeeds. No dedicated test file exists for this component (none existed
before this change); not added here — the only consumer,
`StreamManagerPanel.tsx`, references it as an opaque child with no direct
type coupling, confirmed via grep. Not manually verified in a running
browser this session.
