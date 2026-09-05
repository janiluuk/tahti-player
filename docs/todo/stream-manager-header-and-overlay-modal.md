# Stream Manager: header/status cleanup + overlay-in-modal

**Status:** done (2026-09-05), with some interpretation calls flagged below
— re-check against what the user actually pictured before considering
this fully closed.

## What shipped

- **Title**: "Stream playlist manager" → "Stream Manager" (this is what
  the earlier session grep for `"Stream Playlist Manager"` missed —
  wrong case).
- **Status dot**: was a colored dot (Live/Playing → green) *plus* a text
  pill repeating the same state (`LIVE`/`PLAYING`/`PAUSED`/`STOPPED`).
  Now: green pulsing dot for `Live`, static yellow dot for `Playing`
  (rotation, not actually live), no dot for `Paused`/`Stopped`. Text pill
  removed entirely — the `outputLabel` text next to it (`Live
  broadcast`/`Track rotation`/etc.) already conveys the state in words,
  so nothing is lost, just de-duplicated. The `role="status"
  aria-label="Player state: ..."` on the wrapping span is unchanged, so
  screen readers still get the state.
- **Current track → artist/title swap**: the bold/primary line now shows
  `rotation.artistName`; the secondary line shows `rotation.title` +
  duration (artist no longer sits next to the duration). **Interpretation
  call**: the request ("move the artist out from next to duration, and
  replace the current track with the artist") could also have meant
  dropping the title entirely rather than demoting it to the secondary
  line — kept the title since silently deleting displayed data seemed
  like the larger risk of the two readings.
- **Stats grid**: `Output` label → `Mode` (same value). `Signal` stat's
  rotation-only case now reads `Offline` instead of `Rotation` (no live
  encoder signal when only rotation is running, which is what this stat
  is actually about). `Time left` stat replaced entirely with an
  `Overlay` stat (`On`/`Off`, from `streamOverlayShowTitle`) that's
  clickable (`role="button"`, `Enter`/`Space` handled) and opens
  `StreamOverlayEditor` in a `Dialog` — `StreamOverlayEditor` already
  toasts its own save result and has the on/off toggle built in (shipped
  earlier today), so this modal just wraps it and refreshes the chip's
  `On`/`Off` value in `onSaved`. The `Time left` stat was redundant with
  the current-track duration already shown in the header, so nothing
  unique was lost.
- **Overlay tab removed**: the `Tabs.List`'s third tab, the
  `activeTab === 'overlay'` content block, and the `activeTab` type
  narrowed to `'rotation' | 'stats'`. The overlay stat chip + modal is now
  the only entry point to `StreamOverlayEditor` from this panel.
  `remainingSec` (only used by the deleted `Time left` chip) and the
  `Clock3Icon` import (only used by that chip's icon) were removed as
  dead code.

## Not done here (separate, larger items — still queued)

- Icon-button playlist edit with a confirm dialog before switching
  (`docs/todo/queued-ux-fixes-2026-09-05.md`).
- Now-playing artwork with hover play/pause next to the transport
  controls.
- Top-nav broadcast icon rotation dot + Stream Manager quick-access icon
  (separate component, `AppTopNav.tsx`).

## Verification

`tsc --noEmit` and `eslint` clean. `pnpm --filter @tahti-player/tahti-web
build` succeeds. No dedicated test file exists for `StreamManagerPanel`;
none added. Not manually verified in a running browser — in particular,
the artist/title swap and the removed text-status pill are visual
judgment calls worth a quick look once there's a way to see them live.
