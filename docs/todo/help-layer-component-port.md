# Port HelpLayer from tahti, use it on Go Live

**Status:** done (2026-09-05) for the port + first usage. Other queued
items that reference "the help layer" should now use this component
too — see the follow-ups list below.

## Background

`docs/todo/go-live-header-subtext-cleanup.md` (same day, earlier in this
session) moved Go Live's static panel subtext into the standalone Help
Center (`content/help.ts`) instead, because no inline "help layer" UI
existed in tahti-player at the time. Mid-task the user flagged that the
sibling `tahti` repo (main platform) has a real, small `DesignerHelpLayer`
component — an inline collapsible "? Help for this section" disclosure,
used once in that repo's channel designer toolbar
(`apps/web/src/app/dashboard/channel/_designer-help-layer.tsx`,
`_channel-editor-sections.tsx`) — and asked (as an open question, not a
directive) whether it should be ported. Asked the user directly; they
said yes.

## What shipped

- `packages/tahti-web/src/components/HelpLayer.tsx` — new component,
  same API shape as the original (`title`, `children`, `defaultOpen`),
  rebuilt with this repo's own Tailwind/`cn` conventions instead of the
  original's `studio-designer-help__*` CSS classes (no stylesheet
  defining those classes was found anywhere in the `tahti` repo, so
  there was nothing concrete to port visually — this uses the same
  rounded-pill-button + bordered-panel language as the rest of
  tahti-player, e.g. `BroadcastPreflightPanel`'s existing "?" tooltip
  badge and the credentials-expand chevron in `StudioGoLiveView`).
  `CircleHelpIcon` (lucide-react) instead of a bare "?" glyph.
- `HelpLayer.test.tsx` — starts collapsed, toggles `aria-expanded` and
  content visibility on click, and supports `defaultOpen`.
- Wired into `StudioGoLiveView.tsx`: one page-level `HelpLayer` ("How
  broadcasting works here") right under the live/rotation badge row,
  containing the same explanations that were moved to the Help Center
  article — OBS/Icecast/Traktor connection steps, the Ready-made OBS
  preset note, the Multistream mirroring note, and the Recording note.
  The Help Center article content from the earlier pass was left in
  place too (durable, searchable reference for anyone who navigates to
  Help directly) — this isn't redundant with the inline disclosure so
  much as the same explanation surfacing in two places on purpose, one
  contextual and one reference-shaped.

## Follow-ups this unblocks (not done here)

These queued items in `docs/todo/queued-ux-fixes-2026-09-05.md`
reference "the help layer" and should use this component going forward
instead of the Help Center:
- `StreamOverlayEditor`'s removed explanatory paragraph ("Stream
  overlay cover: default placeholder + auto-fill text" item).
- Any future Studio/Admin page in the STUDIO-ADMIN-UX-SWEEP.md
  `inline-help-text` list that gets revisited — that doc currently
  prescribes "Tooltip" for those; `HelpLayer` is a reasonable
  alternative for anything long enough to need multiple paragraphs
  rather than a one-line Tooltip flyout.

## Verification

`tsc --noEmit`, `eslint`, `pnpm --filter @tahti-player/tahti-web test`
(467 tests, all passing, including the 2 new `HelpLayer` tests), and
`pnpm --filter @tahti-player/tahti-web build` all pass. Not manually
verified in a running browser.
