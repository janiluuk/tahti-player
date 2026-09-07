# One-time track purchases: no artist-facing UI exists at all

**Status:** open

Found 2026-09-07 while implementing the PWYW buyer-side amount input
(`docs/todo/pay-what-you-want-pricing.md`): the whole "sell an
individual track" feature (`PurchaseTier` in `../tahti-org`) has a
complete backend (create/patch tier API, checkout with optional
`amountCents` override, `Purchase` records) and a buyer-facing "Buy
this track" button on `TrackDetailView.tsx` — but **no artist-facing
UI anywhere** to actually create a tier or gate a track behind one.

## Found

- `api/purchase-tiers.ts` exports `createPurchaseTier`/
  `updatePurchaseTier`/`fetchPurchaseTiers` — grepped every `.tsx` in
  `src/components` and `src/views`: zero callers.
- `TrackEditDialog.tsx` (the only place a track's `accessMode` could
  plausibly be set to `PURCHASE` and assigned a tier) has no such
  field.
- Compare to `FanTiersEditor.tsx`, which is the real, wired-up
  equivalent for the *recurring* subscription tiers (`FanTier`) — no
  analogous component exists for `PurchaseTier`.

So `TrackDetailView.tsx`'s buy button, and the PWYW amount dialog added
alongside it, are currently unreachable in practice: nothing in the
product can produce a track with `accessMode: 'PURCHASE'` and a real
`purchaseTierId` except manually seeded mock/test data.

## Scope (not started)

- A `PurchaseTier` list/editor, likely in Studio's money/monetization
  area alongside `FanTiersEditor` (check `SettingsPanels.tsx`'s
  "Money" tab or wherever `FanTiersEditor` is actually mounted, for the
  existing convention to match) — create/edit/deactivate tiers, name,
  suggested price, and (now that the backend supports it) a
  "pay what you want" toggle.
- A way to assign a tier + `accessMode: PURCHASE` to a specific track —
  most likely a field in `TrackEditDialog.tsx`, picking from the
  artist's existing tiers (mirrors how `StudioSoundsView`/track editing
  already handles other per-track settings).

Not scoped further — needs a look at where `FanTiersEditor` mounts
today to decide whether `PurchaseTier`'s editor is a sibling panel in
the same settings area or its own place, before implementing.
