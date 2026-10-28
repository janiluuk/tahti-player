# Mock mode checklist (`VITE_FORCE_MOCK=1`)

Offline demo state lives in [`src/api/mock-session.ts`](src/api/mock-session.ts) (mutable) plus fixtures in [`src/api/mock.ts`](src/api/mock.ts).

## Working end-to-end paths

| Flow                               | Notes                                                                                                         |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Login / TOTP / logout              | Session via `setMockSessionUser`; `/me` returns it; persist rehydrates session                                |
| Listen / Radio / Channel / Archive | Directory + HLS/MP3 fixtures                                                                                  |
| Gated track page (`/t/$id`)        | `northern-lights-archive-6` (fan subs) · `northern-lights-archive-7` (purchase)                               |
| Favorites / Follow                 | Mutable following set                                                                                         |
| Fan subscribe                      | Activates in-session; Account / Settings Money lists it                                                       |
| Studio upload (FORCE_MOCK)         | `mock-uploads.ts` keeps the original file; public `/t/:id` and download use it once visibility is not PRIVATE |
| Studio Go Live                     | Broadcast mocks + simulate signal                                                                             |
| Jam `/jam/AURORA42`                | Stable mock code; other codes show invalid/ended empty states                                                 |
| Listening party `/party/:id`       | `lp-mock-scheduled` · `lp-mock-live` (mid-album) · `lp-mock-ended` · `lp-mock-canceled`; Studio schedule/reschedule/cancel as `northern-lights` (`listening-parties-mock.ts`) |
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

- [x] Chat: persist mock sends into shared history store (reload-safe) (batch 66 #5)
- [x] Seed richer archive / releases / collections for Studio browse
- [x] Newsletter send confirmation (success toast + list refresh under mock)
- [x] DM search users fixture expansion (batch 67 #7)
- [x] Tag search (`fetchTracksByTag`) — offline tracks from mock latest genres + search title hits
- [x] Press-kit gallery upload mock — Settings → Artist / Studio branding gallery; reloads across tabs (batch 73 #2)
- [x] Member invite mock — Settings → Artist → People add-person flow (toast + list refresh, batch 73 #3)
- [x] Stash upload / delete mock store (wave 7)
- [x] Venue register mock success path
- [x] TOTP setup/confirm/disable mock path
- [ ] Visualizer: no mock needed — needs real WebGL runtime
- [x] Stash share mock — create/revoke toasts + list refresh (`StashFilesPanel` / `api/sources/stash.ts`)
- [x] Sound share links (PRIVATE/STASH sound → keyed `/t/:id?key=...` link) — mock create/list/revoke in `api/studio.ts`; backend routes in review in tahti-org#568/#569 (see FEATURES.md)
- [x] Mock archive upload visibility — `arch-mock-*` ids resolve on `/t/:id` and return the uploaded bytes when public (`src/api/mock-uploads.ts`)

## Run

```bash
VITE_FORCE_MOCK=1 pnpm --filter @tahti-player/tahti-web dev
```
