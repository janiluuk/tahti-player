# Pay-What-You-Want Pricing Option

**Status:** open

Add a "pay what you want" option for fan subscriptions / purchase tiers,
where the artist sets a suggested price but the buyer can choose to pay more
or less. The set price should be the default preference (pre-filled), but
the customer can override it.

## Scope

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

### Buyer / listener side
- Purchase / subscribe dialog shows the default price as a pre-filled
  amount input when PWYW is selected.
- Buyer can increase or decrease the amount (respecting minimum).
- If no minimum, a floor of $0 (or currency equivalent) applies.
- Custom amount is submitted with the purchase / subscription request.

### API
- `POST /subscriptions` and `POST /purchases` accept an optional `amount`
  override when the tier is PWYW.
- Server validates: amount >= minimumPrice (if set), amount > 0.
- Existing fixed-price flows unchanged.

## NOT in scope
- Preset "suggested amounts" (e.g. $3 / $5 / $10 buttons) — can follow later.
- Per-transaction tip slider on the track page — separate feature.
- Currency conversion or multi-currency display.
