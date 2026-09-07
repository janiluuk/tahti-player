# Pay-What-You-Want pricing: buyer-side amount input

**Status:** partial

## Corrected understanding (2026-09-07)

This doc originally assumed PWYW needed new backend schema
(`pricingModel` enum, `minimumPrice` field) built from scratch. Wrong —
checked `../tahti-org`'s actual schema/routes first this time:
`PurchaseTier.priceOptional` (boolean) and the checkout endpoint's
`amountCents` override already existed and have been shipping. There is
**no separate minimum-price concept** in the real design — a
`priceOptional` tier's floor is always €0 (a free claim, no Stripe
involved), not an artist-configurable minimum. This doc's original
"Data model"/"API" sections below are stale/superseded — left for
reference, not a spec to implement.

**What was actually missing and is now fixed:** `GET /api/tracks/:id`
never returned `priceOptional`, so the frontend had no way to know a
tier was PWYW. Backend fix: `../tahti-org` PR
[#461](https://github.com/janiluuk/tahti-org/pull/461) (adds
`purchaseTierPriceOptional` to the response + typed schema). Frontend
fix (this repo, 2026-09-07): `TrackDetailView.tsx`'s "Buy this track"
now opens a "Name your price" dialog (pre-filled with the suggested
price, floor €0) instead of always silently charging the suggested
amount, when `detail.purchaseTierPriceOptional` is true. Uses the same
euros-string-input pattern as `FanTiersEditor.tsx`.

**Not covered by this doc, tracked separately:** there is currently
**no artist-facing UI anywhere** to create a `PurchaseTier` or assign
one to a track — `createPurchaseTier`/`updatePurchaseTier` exist in
`api/purchase-tiers.ts` but no component calls them, and
`TrackEditDialog.tsx` has no tier-assignment field. So the buyer-side
fix above has no real path to a `PURCHASE`-gated track today outside
manually-seeded mock data. See
`docs/todo/purchase-tier-artist-editor-missing.md`.

## Not verified live

Typecheck/lint/full test suite all pass, and the new dialog follows an
existing, proven pattern exactly (`FanTiersEditor`'s price input), but
this was **not manually verified in a running browser** — building a
mock `PURCHASE`-gated, `priceOptional` track requires either the
missing artist editor above or manually seeding
`tahti-mock-uploaded-sounds` + IndexedDB blob state, which wasn't done
this pass.

## Original scope (superseded, kept for reference)

Add a "pay what you want" option for fan subscriptions / purchase tiers,
where the artist sets a suggested price but the buyer can choose to pay more
or less. The set price should be the default preference (pre-filled), but
the customer can override it.

### Data model
- Add `pricingModel` field to subscription/purchase tier schema: `'FIXED'` |
  `'PAY_WHAT_YOU_WANT'` (default `'FIXED'`).
- Add `minimumPrice` field (nullable; when set, buyer cannot go below).
- Existing tiers remain `'FIXED'` — no migration needed, opt-in per tier.

### Artist / Studio side
- Tier editor gains a pricing model toggle (FIXED vs PAY_WHAT_YOU_WANT).
- When PWYW is selected, show minimum price input (optional) and default
  price input (the pre-filled amount).
- Tier card in Studio shows a badge or icon indicating PWYW.

### API
- `POST /subscriptions` and `POST /purchases` accept an optional `amount`
  override when the tier is PWYW.
- Server validates: amount >= minimumPrice (if set), amount > 0.
- Existing fixed-price flows unchanged.

## NOT in scope
- Preset "suggested amounts" (e.g. $3 / $5 / $10 buttons) — can follow later.
- Per-transaction tip slider on the track page — separate feature.
- Currency conversion or multi-currency display.
- Extending PWYW to recurring `FanTier` subscriptions — only the
  one-time `PurchaseTier` model has `priceOptional` today.
