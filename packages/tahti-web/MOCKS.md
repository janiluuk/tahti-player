# Mock mode checklist (`VITE_FORCE_MOCK=1`)

Offline demo state lives in [`src/api/mock-session.ts`](src/api/mock-session.ts) (mutable) plus fixtures in [`src/api/mock.ts`](src/api/mock.ts).

## Working end-to-end paths

| Flow                               | Notes                                                                                                         |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Login / TOTP / logout              | Session via `setMockSessionUser`; `/me` returns it; persist rehydrates session                                |
| Listen / Radio / Channel / Archive | Directory + HLS/MP3 fixtures                                                                                  |
| Favorites / Follow                 | Mutable following set                                                                                         |
| Fan subscribe                      | Activates in-session; Account / Settings Money lists it                                                       |
| Studio upload (FORCE_MOCK)         | `mock-uploads.ts` keeps the original file; public `/t/:id` and download use it once visibility is not PRIVATE |
| Studio Go Live                     | Broadcast mocks + simulate signal                                                                             |
| Sources OAuth Connect              | In-app mock connect/disconnect (no real OAuth redirect)                                                       |
| Stripe Connect onboard             | In-app activate — no `connect.stripe.com` redirect                                                            |
| Chat join / send                   | Local mock append (history REST)                                                                              |
| Governance vote / comment          | In-memory motions                                                                                             |
| Messages / Studio catalog          | Module-local stores                                                                                           |

## Demo credentials

- Any email + password → artist user with matching channel slug
- `demo@tahti.live` → username `demo`, Studio ready
- `listener@tahti.live` (or `listener+anything@…`) → a plain listener: registered, no channel, not a member, role `LISTENER`
- TOTP: email containing `+totp` or password `totp-demo`, then code `000000` or `123456`

## Live vs mock (demock)

Production / beta builds (`import.meta.env.PROD`) **do not** fall back to fixtures when the API fails — see `src/api/mode.ts`. Use `FEATURES.md` for the port + demock checklist.

## Still thin / next mock polish

- [ ] Chat: persist mock sends into shared history store (reload-safe)
- [ ] Seed richer archive / releases / collections for Studio browse
- [ ] Newsletter send confirmation + DM search users fixture expansion
- [ ] Press-kit gallery upload mock (currently link-out)
- [ ] Member invite mock (currently link-out)
- [x] Stash upload / delete mock store (wave 7)
- [x] Venue register mock success path
- [x] TOTP setup/confirm/disable mock path
- [ ] Visualizer: no mock needed — needs real WebGL runtime
- [ ] Stash share mock
- [x] Sound share links (PRIVATE/STASH sound → keyed `/t/:id?key=...` link) — mock create/list/revoke in `api/studio.ts`; backend routes in review in tahti-org#568/#569 (see FEATURES.md)
- [x] Mock archive upload visibility — `arch-mock-*` ids resolve on `/t/:id` and return the uploaded bytes when public (`src/api/mock-uploads.ts`)

## Run

```bash
VITE_FORCE_MOCK=1 pnpm --filter @tahti-player/tahti-web dev
```
