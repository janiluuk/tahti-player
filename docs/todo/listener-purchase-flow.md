# Listener Purchase & Subscription Flow — Register, Buy/Subscribe, Account Panel

**Status:** partial

## Update 2026-09-07

Shipped: the Subscriptions tab (`/settings/account` → "Your subs") now has
a **Manage → Cancel subscription** action, wired to the real
`POST /api/me/subscriptions/:id/cancel` (already existed in
`../tahti-org`, unused until now) via a new `cancelMySubscription()` in
`api/client.ts`, with a `ConfirmDialog` confirming the access-until-period-end
semantics. Cancelled rows show "cancels &lt;date&gt;" instead of the raw
state and lose the Manage button.

Still open, unchanged from below: the **Purchases tab doesn't exist**, and
the **E2E test** needs a test-mode Stripe Checkout path in `../tahti-org`
to exercise real purchase/subscribe UI flows end to end — both judged too
large to build blind in one pass on top of the cancel-flow piece.

## Update 2026-09-08 — Purchases tab shipped

No buyer-side "list what I bought" endpoint existed at all in
`../tahti-org` (only an artist-side `GET /api/me/purchase-tiers/orders`)
— added `GET /api/me/purchases` (dedicated `tahti-org-worktrees/`
worktree, `feat/listener-purchases-endpoint`, PR
[#483](https://github.com/janiluuk/tahti-org/pull/483), not merged by
this session), mirroring the orders endpoint's shape/`PAID`-only filter,
joined through `PurchaseTier` to the gated `Sound` rows for track
titles. Extended `purchase-tiers.test.ts`'s existing checkout test:
buyer sees the sale via the new endpoint, a stranger who bought nothing
gets `[]` (5/5 pass).

On this side: `PurchaseRow` type (`api/types.ts`), `fetchMyPurchases()`
(`api/client.ts`, same mock/real pattern as `fetchMySubscriptions`),
`listMockPurchases()` (`api/mock-session.ts`, one seeded mock row). New
"Purchases" tab in `/settings/account`'s `AccountPanel`
(`views/settings/SettingsPanels.tsx`), same list-row shape as "Your
subs": track title(s), artist (linked), price, purchase date, and a
"Listen" button to `/t/$id` for the first gated track.

`tsc --noEmit`, `eslint`, `pnpm vitest run` (486/486) all pass. Not
live-browser-verified (Chrome extension unavailable this session).

Still open: the **E2E test** (needs a test-mode Stripe Checkout path in
`../tahti-org`) — judged too large to build blind on top of this piece,
same as noted 2026-09-07.

As a listener, I should be able to register, purchase a product or subscribe
to an artist, and see both in my account. Subscriptions should be manageable
including cancellation. E2E test with minimal mocking.

## Existing coverage

`fan-sub-and-track-purchase.spec.ts` covers the **artist side** (upload →
create tier → fan subscribes → fan buys → artist sees orders in Revenue →
audit log). What it does **not** cover:

- The **buyer's own Purchases/Subscriptions view** (`/settings/account`)
  — no test asserts purchases or active subscriptions appear there.
- **Subscription management** — no test for viewing, managing, or
  cancelling a subscription from the listener's account.
- A **listener-specific** registration path.
- Verifying anything is visible **to the buyer** before checking the
  artist side.

## Scope

### Account panel — Purchases tab
- `/settings/account` → Purchases tab should list purchased tracks.
- If the tab does not exist yet, create it.

### Account panel — Subscriptions tab
- `/settings/account` → Subscriptions tab should list active subscriptions
  with: artist name, tier name, status, price.
- Each subscription row has a **Manage** action → opens a dialog or
  navigates to a management surface.
- Management includes **Cancel subscription** (with confirmation dialog).
- After cancellation, status updates to "Cancelled" (or row is removed on
  next load, depending on product decision).

### E2E test (`listener-purchase-flow.spec.ts`)
Minimal mocks — only Stripe (`installStripeMock`). Everything else through
real UI.

#### Test 1: Listener buys a track, sees it in account
1. Artist → upload sound → set PUBLIC → create purchase tier → link to sound.
2. Sign out → register listener via `/join`.
3. Navigate to `/t/{soundId}` → "Buy this track" → purchase completes.
4. Navigate to `/settings/account` → Purchases tab.
5. Assert purchased track title appears in the list.

#### Test 2: Listener subscribes, sees active subscription, cancels it
1. Artist → create a fan subscription tier via Studio Revenue.
2. Sign out → register listener via `/join`.
3. Navigate to `/subscribe/{artistUsername}` → click "Subscribe" → confirm.
4. Navigate to `/settings/account` → Subscriptions tab.
5. Assert active subscription appears (artist name, tier, status).
6. Click Manage → Cancel → confirm cancellation.
7. Assert subscription status changes to Cancelled (or disappears).

#### Test 3: Round-trip verification (lightweight)
1. After Test 1 purchase → sign in as artist → `/studio/audience`.
2. Assert the order appears in the fan order list.

### What NOT to mock
- Registration, login, upload, tier creation, navigation — all real UI.
- Only mock: Stripe payment (`installStripeMock`).

## NOT in scope
- Upgrade / downgrade subscription tier.
- Refund flow.
- Multi-item purchases or cart.
- Download verification after purchase (covered by existing test).
- Proration or billing-cycle edge cases.

## Dependencies
- `installStripeMock` from `e2e/helpers/mockStripe.ts` (exists).
- `signUpFan` helper from `fan-sub-and-track-purchase.spec.ts`.
- Subscription management UI in `/settings/account` (may need creation).
