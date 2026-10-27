# Stay signed in: JWT access tokens + refresh tokens for every client

**Status:** partial

Requested by the user on 2026-10-19: use JWTs with a refresh-token mechanism in
all clients so people stop having to sign in again and again. It must be robust
(keeps you signed in) and live in its own component so it doesn't clutter the
project and can be extended later.

Cross-repo: the token issuer is `../tahti-org` (API); the clients are in this
repo. Needs the user's go-ahead before tahti-org work starts.

## How auth works today (checked 2026-10-19)

- **Web / desktop:** opaque session id in a cookie (`config.sessionCookieName`,
  `sameSite: 'lax'`, `domain: config.sessionCookieDomain`), `maxAge` 30 days
  (`apps/api/src/config.ts` `sessionMaxAgeSec`). Validated per request in
  `apps/api/src/lib/session.ts` with a Redis cache.
- **Fixed expiry:** `createSession` sets `expiresAt` once; nothing extends it
  while the user is active, so a session dies 30 days after login no matter
  how often it is used.
- **Every login signs out every other device:** `revokeAllSessions` (SEC-010)
  runs before each new login session. Signing in on the phone, the desktop
  app or another browser ends the sessions everywhere else. This alone
  explains much of "I have to log in all the time".
- **CLI:** personal API tokens (`Authorization: Bearer tahti_…`,
  `apps/api/src/lib/api-token.ts`); `packages/tahti-cli` stores one via
  `tahti login`. Long-lived, scoped, no refresh.
- **Desktop:** the Tauri app renders tahti-web (see
  `desktop-app-runs-tahti-web`), so it uses the same cookie session inside
  the webview.

## Target design

**Server (tahti-org), one module, e.g. `apps/api/src/auth/tokens/`:**

- Short-lived access token: signed JWT (≈10–15 min; `sub`, `sid`, roles,
  `iat`/`exp`, key id), verified statelessly; suspended/deleted users are
  still caught at refresh time and by a small deny-list keyed on `sid`.
- Long-lived refresh token: opaque random value, stored hashed in a
  `RefreshToken` table (`familyId`, `sessionId`, device label, `lastUsedAt`,
  `expiresAt`, `revokedAt`). Sliding expiry (e.g. 60 days from last use, with
  an absolute cap such as 1 year).
- **Rotation with reuse detection:** every refresh returns a new refresh token
  and retires the old one; presenting a retired token revokes the whole
  family (stolen-token signal). Allow a short grace window (≈30 s) so two
  tabs refreshing at once don't trip it.
- Per-device sessions: login creates a new family for that device instead of
  revoking all others. "Sign out everywhere" and a device list in
  Settings › Account replace the blanket revoke from SEC-010.
- Endpoints: `POST /api/auth/token/refresh`, `POST /api/auth/logout`
  (revokes the family), `GET/DELETE /api/me/sessions` (device list).
- Web delivery: refresh token in an `HttpOnly; Secure; SameSite=Lax` cookie
  scoped to the refresh path; access token in memory only (never
  localStorage). Native/CLI delivery: both tokens in the response body.
- Keep the cookie session working during the transition; API tokens for the
  CLI stay as they are (scoped automation), with JWT login as an option.

**Client: one package in this repo, e.g. `packages/auth-session`
(`@tahti-player/auth-session`), framework-free:**

- Holds the access token in memory and exposes `getAccessToken()`,
  `fetchWithAuth()` (adds `Authorization`, on `401` refreshes once and
  retries), `signIn` / `signOut`, and an `onChange` event.
- Single-flight refresh: concurrent requests wait on one refresh call.
- Proactive refresh shortly before `exp`, plus on tab focus / network
  reconnect / wake from sleep.
- Cross-tab coordination with `BroadcastChannel` (+ a Web Locks guard) so only
  one tab refreshes and the others pick up the new token; sign-out propagates
  to every tab.
- Pluggable storage adapter: browser (cookie-only refresh), Tauri (OS
  keychain via a small plugin), Node CLI (config file with `0600`).
- Clear failure states: refresh rejected → signed-out event once, not a loop
  of 401s; offline → keep the current state and retry later.
- tahti-web wires it in one place (the API base / `requestJson` helpers and
  `authStore`); views do not touch tokens.



## Progress (2026-10-20)

- tahti-org [#880](https://github.com/janiluuk/tahti-org/pull/880): RefreshToken
  table, access JWT, refresh rotation + reuse grace, `/api/me/sessions`, login
  no longer revokes other devices.
- `@tahti-player/auth-session`: in-memory access token, single-flight refresh,
  cookie refresh adapter, `fetchWithAuth`.
- tahti-web: `requestJson` goes through auth-session; Settings → Account →
  Devices; cookie session still works as fallback.

### Still open

- Deploy/migrate tahti-org #880 in each env.
- Desktop: wire `createInjectedStorage` to a real Tauri OS keychain plugin +
  verify sleep/wake / offline cold start (adapter + notes shipped; plugin TBD).
- Eventually drop cookie-session once all clients are on tokens.

- 2026-10-27 (batch 90): desktop keychain storage. Rust `auth_keychain`
  (`keyring` 4: macOS Keychain, Windows Credential Manager, Secret Service
  over zbus on Linux) behind `auth_refresh_token_get` / `_set` commands;
  malformed values are refused or dropped, errors never carry the token.
  `packages/player/src/desktopAuthStorage.ts` exposes it to tahti-web as
  `globalThis.__TAHTI_NATIVE_AUTH_STORAGE__` (inert until tahti-web reads it).

### Phase 4 (this slice)

- `createNodeConfigFileStorage` + `createInjectedStorage` in
  `@tahti-player/auth-session` (CLI config file / desktop keychain bridge).
- CLI `tahti login --device` (+ `--email` / `--password`): password login,
  persists access + refresh under `~/.config/tahti/config.json` mode `0600`,
  refreshes on 401 in `api-client`. Personal `tahti_` tokens unchanged.

## Plan (slices)

1. Decide with the user: drop the "every login signs out other devices" rule
   now (quick win, tahti-org only) or wait for per-device sessions.
2. tahti-org: token module + `RefreshToken` table + refresh/logout endpoints,
   behind a flag, with tests for rotation, reuse detection and the grace
   window.
3. `@tahti-player/auth-session` package with unit tests (fake timers, two
   simulated tabs, offline).
4. tahti-web: route `api/http.ts` requests through it; keep cookie fallback
   until production has run on JWTs for a while.
5. Desktop: keychain storage adapter; check sleep/wake and offline start.
6. CLI: optional `tahti login --device` using the same refresh flow.
7. Settings › Account › Devices (list, sign out one, sign out everywhere).
8. Remove the cookie-session path once all clients are on tokens.

## Done when

A signed-in user on web, desktop and CLI stays signed in across restarts,
sleep and weeks of normal use, signing in on another device does not sign
them out, and a stolen refresh token is detected and revoked.

## Desktop / CLI cutover notes

- **Desktop (Tauri webview):** same cookie refresh path as web for now.
  `createInjectedStorage` is the host bridge for an OS keychain plugin (not
  wired yet). Call `authSession.start()` on wake/`online` (browser already
  listens) and verify offline cold start keeps signed-in until refresh fails.
- **CLI:** `tahti_` API tokens remain for automation. `tahti login --device`
  calls `/api/auth/login` with `deviceLabel`, persists access + refresh under
  `~/.config/tahti/config.json` mode `0600`, and refreshes on 401 in
  `api-client` (plain Node; does not import the TS package).
- **Cookie session:** remains valid during transition; do not remove until
  web + desktop + optional CLI JWT path have run in production.
