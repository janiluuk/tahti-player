# Go Live: drop static panel subtext, fold into Help center

**Status:** partially done (2026-09-05) — "restore the calendar view" not
attempted; see below. Also see the `HelpLayer`-port comment at the
bottom, which changes what "the right fix" might look like going
forward.

## What "help layer" actually refers to (found via git archaeology)

The report said to move Go Live's header subtexts into "the help layer
view." That phrase doesn't name an existing tahti-player feature by
that name today, but the branch this work is on
(`feat/studio-subtabs-help-layer`) is literally named after it: commit
`365e053f7` ("Align Studio page subtabs with Stats and move header
blurbs to Help") is the origin of that pattern, and its own
`docs/todo/studio-subtabs-help-layer.md` says explicitly: "Dropped
static ViewShell `subtitle=` on ordinary chrome pages; durable copy
lives in Help (`getting-around` / `for-artists`) and H-key page tour."
So in *this* codebase, at the time this branch started, "help layer" =
`packages/tahti-web/src/content/help.ts` (the standalone Help Center
page, `HelpView.tsx`), not an in-page drawer. This task followed that
existing, already-established convention.

## What shipped

In `StudioGoLiveView.tsx`:
- Dropped `StudioPanel`'s `description` prop entirely from "Connect
  broadcasting software", "Recording", and "Multistream" — each was a
  one-line caption restating what the section title / adjacent
  status text already said (e.g. "Mirror your broadcast to other
  platforms" next to a panel literally titled "Multistream").
- Removed the "Ready-made OBS setup" explanatory caption (kept the
  title + the download button) and the always-visible OBS/Icecast
  paste-instructions block beneath the credentials fields.
- Expanded the existing `broadcast` Help Center article
  (`content/help.ts`) to cover what got removed: a new bullet on the
  OBS section mentioning the Ready-made OBS preset download, and a new
  "Traktor, Mixxx, and other Icecast-compatible apps" section covering
  the Server/Mount/Password paste flow. The "Mirror your broadcast to
  other platforms" caption needed no migration — the `multistream`
  Help article already opens with nearly that exact sentence.

## Not done: "restore the calendar view to the top panel"

Checked `git log -p` on `StudioGoLiveView.tsx` across its entire
history — no "calendar" reference has ever existed in this file. So
this isn't a regression in this file; it's either referring to a
different page entirely (candidates found repo-wide:
`StudioScheduleView.tsx`, `RadioBookingCalendar.tsx`,
`StudioEventsView.tsx`/`StudioEventCreateView.tsx`) or a mental model
from a different app/mockup. Didn't guess which one — flagging for the
user to point at directly rather than embedding the wrong calendar
into Go Live's top panel.

## Comment surfaced mid-task: a real `HelpLayer` component exists in
the sibling `tahti` repo, not yet ported

While this task was in flight, the user mentioned (not as a directive,
explicitly "not sure" whether to act on it): the main `tahti` repo has
a `DesignerHelpLayer` component
(`apps/web/src/app/dashboard/channel/_designer-help-layer.tsx`) — a
small (47-line) collapsible "? Help for this section" toggle used
*inline*, once, in that repo's channel designer toolbar
(`_channel-editor-sections.tsx`), showing per-section instructional
copy without navigating away from the page. No CSS for its
`studio-designer-help__*` classes was found anywhere in that repo
either, so its visual styling in production is unclear/possibly
minimal.

This is a different, more literal match for "help layer" than the
Help-Center-article interpretation this task actually used — it's an
inline, per-page/per-section disclosure, not a separate page you
navigate to. If the user decides to port it, several other queued
items in `docs/todo/queued-ux-fixes-2026-09-05.md` that reference "the
help layer" (`StreamOverlayEditor`'s removed explanatory paragraph, the
Go Live subtext this task just moved) would likely be better served by
wrapping their copy in a ported `HelpLayer` component directly on the
page, rather than by the Help Center article approach used here. Not
acted on without confirmation — this is a real UX-pattern decision
(inline disclosure vs. separate reference page), not just an
implementation detail.

## Verification

`tsc --noEmit`, `eslint`, `pnpm --filter @tahti-player/tahti-web test`
(all 465 existing tests across the package, including
`content/help.test.ts`), and `pnpm --filter @tahti-player/tahti-web
build` all pass. Not manually verified in a running browser.
