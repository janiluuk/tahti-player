# Image upload widgets — hover delete + preview modal

**Status:** partial

Status: shared primitives done (2026-09-04). New chrome lives under
`src/components/imageSlot/` (`useImageSlotChrome`, `ImageSlotDeleteBadge`,
`ImageSlotPreviewDialog`) and is wired into `RoundImageUploadButton`,
`BackdropUploadButton`, `ImageUploadField`. `ImageSlotPreviewDialog` reuses
the shared `ConfirmDialog` for the delete confirm step and already accepts
an optional `frames` list (per-frame delete) for a future slideshow
consumer. Storybook stories added for all three: Empty / Set / preview
modal open / confirm-delete (`play` functions), documented as hover for
the corner X badge.

Consumers of the three primitives get the new behavior automatically —
verified via `grep`: `TrackEditDialog` (release artwork), `ShowImagePicker`,
`VenueRegisterView`, `StudioScheduleView`, `StudioVenuesView`,
`AdminDiscoWidgetsView`, `AdminNewsView`, `BroadcastPreflightPanel`,
`ListenAddonsPanel` all render one of the three shared components directly.

`RadioStationCover` was left untouched: it has no "empty" state (`src` is
required, not optional) and its edit affordance
(`RadioStationCoverEditButton`) is a full-area absolutely-positioned
overlay button — there's no room for a separate click-to-preview target
without first redesigning that overlay to a small corner control. Tracked
as a follow-up, not done in this pass.

`ArtistGalleryPanel` was checked and needs no change — it already has its
own hover-reveal delete button, a select toggle, and a click-to-lightbox
preview, independently matching this ticket's intent.

**2026-09-07:** Onboarding avatar converted to `RoundImageUploadButton`
(`OnboardingView.tsx`) — was a bespoke `<img>`/letter-placeholder +
"Replace/Add photo" button + raw hidden file input, now the shared
primitive with its own hover-delete X, confirm dialog, and preview
modal. Kept the dedicated `uploadProfileAvatar` endpoint (adapted its
`{ok, avatarUrl}` return shape to the primitive's `{ok, data:{url}}`
contract, same adapter pattern `TrackEditDialog` already uses for its
own upload override) and the existing `refresh()` call after a
successful change so the top-nav avatar stays in sync — wired into
`onChange` since the primitive doesn't know about the auth store.
Live-verified in the browser (`VITE_FORCE_MOCK=1`): empty → upload →
set-with-delete-badge → confirm delete → back to empty, no console
errors. One accepted visual change: the letter-initial placeholder is
gone, replaced by the primitive's standard `ImageIcon` empty state —
consistent with every other consumer of this shared component.

**2026-09-08:** `StudioBrandingView` (avatar + press-kit gallery) checked —
it already had its own bespoke hover-delete (X/trash on hover) and
click-to-preview (`ImageLightbox`) for the avatar, and hover-delete for
each gallery photo, independently matching this ticket's UX goal (like
`ArtistGalleryPanel` above). The one real gap: neither delete path had a
confirm step — both `removeAvatar` and `removeImage` fired immediately
on click, violating this doc's own "Confirm before delete... never
silent clear" rule. Added a `ConfirmDialog` for each (avatar: "Remove
profile picture?"; gallery photo: "Remove this image from your
gallery?"), reusing the same shared `ConfirmDialog` component the
file's existing "replace all gallery images" prompt already uses.
Still bespoke, not migrated onto the shared `imageSlot` primitives —
not attempted here, out of scope for a confirm-dialog fix.
`tsc --noEmit`, `eslint`, `pnpm vitest run` (485/485) all pass. Not
live-browser-verified (no seeded studio session available this pass).

## Not done in this pass (bespoke, not on the shared primitives)

- `StudioBrandingView` avatar/press-kit gallery: hover-delete + preview
  UX and confirm-before-delete are done (2026-09-08); migrating onto
  the shared `imageSlot` primitives is still open, not attempted.
- `ChannelDesigner` backdrop + gallery slideshow
- Collection cover + slideshow
- Admin: radio station logo (blocked on the `RadioStationCover` redesign
  above), announcements

These are all larger, bespoke multi-image or reorderable-gallery flows
(not simple single-image slots) — right-sized as their own follow-up
tickets rather than folded into this bounded pass. `ImageSlotPreviewDialog`
already supports a `frames` strip so a future pass can adopt it without
another primitive redesign.

Depends on shared upload primitives (`RoundImageUploadButton`,
`BackdropUploadButton`, `ImageUploadField`, `RadioStationCover`,
branding/avatar slots, collection slideshow, gallery).

## Goal

Every upload surface that already has an image set (avatars, backdrops,
covers, logos, slideshow frames, etc.) must support:

1. **Hover delete** — hovering the set image shows an **X** in a corner.
   Clicking X opens a confirm dialog, then clears that image (and persists
   if the parent already persists other edits).
2. **Hover / click preview modal** — hovering (or clicking) a set image
   opens a modal with a **large preview**. If the slot is a slideshow /
   multi-image gallery, show the slideshow frames as a strip below the
   large image. From that modal the user can **change** or **delete** the
   current image (or individual slideshow frames).

Empty slots keep today’s behavior: placeholder + click-to-upload (or
gallery picker when multiple images are allowed). Do not show X or the
preview modal when nothing is set.

## Rules (extends media upload convention in WORKPLAN)

- Confirm before delete (shared `Dialog` / confirm pattern — never silent
  clear).
- Change from the modal reuses the same upload accept list and toast
  feedback as the slot’s existing upload path.
- Slideshow: deleting one frame does not delete the whole set; clearing
  the last frame returns the slot to empty placeholder.
- Storybook-first: extend or wrap existing upload primitives; add stories
  for empty / set / hover / modal / slideshow / confirm-delete.
- Keep live data and persist semantics; this is a chrome/UX layer on top
  of existing upload APIs.

## Surfaces to sweep

| Area | Components / views |
| --- | --- |
| Shared | `RoundImageUploadButton`, `BackdropUploadButton`, `ImageUploadField`, `RadioStationCover` |
| Studio branding / channel | `StudioBrandingView`, `ChannelDesigner`, archive banner, header media |
| Collections / gallery | collection cover + slideshow, `ArtistGalleryPanel` |
| Admin | radio station logo, disco widgets, news images, announcements |
| Other | venue / show image pickers, release artwork |

## Out of scope for this ticket

- Accepting pasted URLs as a substitute for upload (still disallowed).
- Changing R2 / media API contracts beyond clear/null fields already
  supported.
- Implementing the UX in the same pass as this worklog (track in
  WORKPLAN + UI-REDESIGN-WORKLOG when started).
