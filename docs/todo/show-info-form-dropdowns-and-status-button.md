# Show info form: dropdowns, layout, status button

**Status:** done (2026-09-05), with one interpretation call flagged below.

## What shipped

`BroadcastPreflightPanel.tsx`:
- `showType` and `visibility` were hand-rolled radio-button "segmented
  control" `fieldset`s (`role="radiogroup"`, `sr-only` radio inputs).
  Replaced both with the shared `Select` component, same 2-column grid
  they were already in.
- Show name and Tagline are now on the same row (`grid-cols-2`). Tagline
  used to be conditionally shown only when `episodeNumber !== null`
  (i.e. only for series episodes) — it's now always visible, since
  pairing it with Show name on one row only makes sense if both are
  reliably present.
- The series-episode `Select` and the (disabled, series-only) episode
  number `Input` moved into their own row together, since they're both
  about the same "which episode is this" concept — previously the
  episode number sat oddly next to Show name and tagline sat oddly next
  to the series picker.

`StudioGoLiveView.tsx`: added a compact "Show info" status pill-button
to the "Ready to take over the rotation" / "Signal ready" panel's
`action` slot (`StudioPanel`'s existing header-action prop), next to the
Go Live button. Yellow dot when `preflight?.title` is empty and the form
hasn't been saved this session; green once either is true
(`showInfoReady = showInfoConfirmed || Boolean(preflight?.title?.trim())`).
Clicking it opens `BroadcastPreflightPanel` a second time, inside a
`Dialog.Root` modal, for quick editing without scrolling to the
always-visible inline copy under "Before you start".

## Interpretation call — flagged

The request said clicking the button should open the form "in a modal
to edit, **instead of (or in addition to — clarify)** its current
always-inline placement." Kept the inline `BroadcastPreflightPanel`
exactly where it already was (under "Before you start") and added the
modal as an *additional* quick-access path, rather than removing the
inline copy — hiding a currently-working, always-visible form felt like
the riskier misread. This does mean there are now two entry points to
the same form (inline panel + modal button), and the existing
`ShowInfoConfirmed` "Confirmed" text next to "Before you start" is left
in place too, so there's some indicator duplication with the new status
button. If the intent was actually to collapse the inline panel away
and make the modal the only way to edit show info, that's a follow-up,
not done here.

## Verification

`tsc --noEmit`, `eslint`, and `pnpm --filter @tahti-player/tahti-web
build` all clean on both touched files. Not manually verified in a
running browser.
