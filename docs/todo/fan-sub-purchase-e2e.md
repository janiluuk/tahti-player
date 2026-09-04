# Fan-sub + track purchase e2e

## Goal

Playwright `e2e/fan-sub-and-track-purchase.spec.ts` against mock Vite
(`VITE_FORCE_MOCK=1`, `PLAYWRIGHT_BASE_URL=http://127.0.0.1:5180`):

1. Artist uploads `riff.wav`, public + downloads on, purchase access.
2. Fan A subscribes, downloads original WAV.
3. Fan B buys the one-time purchase tier, downloads same WAV.
4. Studio → Audience shows both orders.
5. Admin → Activity records fan-sub create + purchase ledger.

## Status

- [ ] Mock commerce ledger (localStorage, same browser context)
- [ ] Wire subscribe → ledger
- [ ] Purchase tier mock API + Buy on track
- [ ] Audience + admin activity read ledger
- [ ] Spec + unit coverage
- [ ] E2e green vs mock Vite
