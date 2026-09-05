# Multistream "add destination": unify on the real configure dialog

**Status:** done (2026-09-05).

## Background

Report: Go Live's "Add destination" modal (`MulticastDestinationForm.tsx`)
was "unusable" — a cramped single-row layout with a raw `Select` dropdown
for provider, no address/port split for Custom RTMP, no ingest-server
hint, no enabled toggle, no save/error state (the `busy` prop it declared
was never even passed from its one caller). A much better version already
existed as `MulticastConfigureDialog` (local to `PluginStorePanel.tsx`,
backing Settings → Add-ons → Multistream): per-provider dialog with a
proper `Input`-based address/port split, ingest hints, an enabled toggle,
real save/error handling — and it's exactly what `providers.ts`'s own
comment calls out as the intended replacement for "the pre-extraction
dropdown".

## What shipped

- Extracted `MulticastConfigureDialog` (+ its `MulticastConfiguring` type)
  out of `PluginStorePanel.tsx` into its own file,
  `components/MulticastConfigureDialog.tsx`, unchanged behavior.
  `PluginStorePanel.tsx` now imports it instead of defining it locally;
  removed the now-unused `createRtmpTarget`/`patchRtmpTarget`/
  `multicastProviderLabel`/`MulticastProviderId` imports there.
- `StudioGoLiveView.tsx`'s "Add destination" flow rebuilt as two steps:
  a small provider-picker list (only providers without an existing
  target, matching `PluginStorePanel`'s one-target-per-provider model)
  followed by the shared `MulticastConfigureDialog` for the chosen
  provider. Replaces the single cramped dropdown-based dialog entirely.
- Deleted `MulticastDestinationForm.tsx` (no longer used anywhere) and
  its Storybook story; added a `MulticastConfigureDialog` story instead
  (new/custom/edit-existing states) and updated the `ElementLocations`
  reference table entry.

## Not done / deliberately out of scope

- Didn't touch the "Multistream" panel's own targets list (enable/disable/
  remove) elsewhere in `StudioGoLiveView.tsx` — only the add-destination
  entry point was broken/duplicated.
- No behavior change to `MulticastConfigureDialog` itself beyond the move
  — it's byte-for-byte the same component, just relocated and now shared.

## Verification

`tsc --noEmit` and `eslint` clean on every touched file in
`@tahti-player/tahti-web` and `@tahti-player/storybook`.
`pnpm --filter @tahti-player/tahti-web build` succeeds. No existing test
file covered either the old or new component; none added (matches prior
coverage state). Not manually verified in a running browser this session.
