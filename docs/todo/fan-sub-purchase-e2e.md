# Fan-sub + track purchase e2e

## Goal

Playwright `e2e/fan-sub-and-track-purchase.spec.ts` against mock Vite
(`VITE_FORCE_MOCK=1`, `PLAYWRIGHT_BASE_URL=http://127.0.0.1:5180`):

1. Artist uploads `riff.wav`, public + downloads on.
2. Fan A subscribes, downloads original WAV.
3. Fan B buys the one-time purchase tier for that track, downloads same WAV.
4. Studio → Audience shows both orders.
5. Admin → Activity records fan-sub create + purchase ledger.

## Product truth

- Sibling already has purchase tiers (`POST …/purchase-tiers/:id/checkout`).
- Fan-sub activate must write mock payout + audit (not only Playwright route overlays).
- Track page gains Buy when `accessMode=PURCHASE`.

## Status

- [ ] Mock commerce ledger
- [ ] Wire subscribe → ledger
- [ ] Purchase tier mock API + Buy on track
- [ ] Audience + admin activity read ledger
- [ ] Spec + unit coverage
- [ ] E2e green vs mock Vite
