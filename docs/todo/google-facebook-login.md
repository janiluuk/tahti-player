# Google and Facebook login

**Status:** partial

Let listeners and artists sign up and log in with Google and Facebook, next to email and password.

## Known

- tahti-web has no social login today (no Google/Facebook auth routes or buttons found on 2026-11-11).
- OAuth app credentials for other services are an ops blocker in [dead-end-leftovers.md](dead-end-leftovers.md); Google and Facebook need their own OAuth apps (client id/secret, redirect URLs per host).
- Auth is JWT access + refresh ([auth-refresh-tokens.md](auth-refresh-tokens.md)); a social login has to end in the same token pair.

## Decisions

- Account linking: a Google login whose email Google reports as verified auto-links to the Tahti account with that email. Facebook never auto-links: an existing account gets `oauth_error=email_in_use` and links Facebook from Settings → Security while signed in. Disconnect is refused (409) when it is the account's last way to sign in.
- Redirect URLs: production only (`api.tahti.live`). Beta and preview environments get no Google/Facebook sign-in; `/providers` returns an empty list there, so the buttons stay hidden.
- Display name: the provider name must pass `safeDisplayName` (no emails as names); fall back to a generated username. The web shows a linked email only as account info in Settings → Security, never as a name.

## Web contract (as built in tahti-web)

- `GET /api/auth/oauth/providers` → `{ providers }`; buttons show only for listed providers, none when empty or failing.
- Start is a full-page navigation to `/api/auth/oauth/:provider/start?returnTo=<path>[&link=1]`. `returnTo` is the current path plus its query, so the API must append `oauth=ok` with `&` when `returnTo` already has a `?`.
- Return: `?oauth=ok` → session refresh + toast + param stripped; `?oauth_error=<code>` (`cancelled`, `email_in_use`, `already_linked`, `not_configured`, `email_required` (Facebook signup without an email), `failed`; unknown → `failed`) → auth dialog with the message when signed out, a toast when signed in.
- `GET /api/me/oauth-accounts`, `DELETE /api/me/oauth-accounts/:provider` (409 `{ error }` shown inline).
- Set a first password: `AuthUser.hasPassword` (`GET /api/auth/me`; missing = `true` for older APIs). When `false`, Security → Password & email shows "Set a password" (`SetPasswordForm`) instead of the change form and `LinkedLoginsSection` hints next to Disconnect when only one login is linked. `POST /api/me/password/set { password }` → 204 (refresh + toast), 409 (refresh, change form), 400 (inline). Mock: `oauth.*` emails sign in without a password. Code: `src/api/account-credentials.ts` `setFirstPassword`, `src/components/SetPasswordForm.tsx`.
- Code: `packages/tahti-web/src/api/oauth.ts`, `src/lib/oauthReturn.ts`, `src/components/OAuthSignInButtons.tsx`, `OAuthReturnHandler.tsx` (mounted in `AppShell`), `LinkedLoginsSection.tsx` (Security → Password & email).

## Plan

- [x] tahti-web: "Continue with Google" / "Continue with Facebook" on log in and sign up, return handling, en + fi.
- [x] Settings → Security → Password & email: list, link and disconnect linked logins.
- [x] tahti-org API: OAuth start + callback for Google and Facebook, create or link the user, issue access + refresh tokens (branch `feat/oauth-google-facebook`). Accounts with 2FA come back as `?oauth=totp&challengeId=<id>`; the web opens the existing two-factor step with that challenge.
- [ ] Ops: create the Google and Facebook OAuth apps and add the secrets.
- [x] API deployed (routes live 2026-11-21, via the GitHub Actions runner).
- [ ] Check the web flow end to end once the secrets are set (real redirects, cookies, `returnTo` with a query).
- [x] Mock-app e2e case in `e2e/roles-anonymous-listener.spec.ts` passes (2026-11-21).
- [x] tahti-web: set a first password from Settings for accounts created with Google/Facebook, plus the `email_required` error (2026-11-21, branch `feat/web-oauth-set-password`).
- [x] tahti-org API: `hasPassword` on `/api/auth/me`, `POST /api/me/password/set`, `email_required`, forgot-password for accounts without a password (tahti-org#1125). #1125 also passes the sign-in env vars to the api container in `infra/docker-compose.stack.yml`, which they were missing.

## Production setup (needs a browser, provider accounts and the server)

1. **Google** (Cloud Console, the project with the Drive import client if there is one):
   - OAuth consent screen: External; app name Tahti; support email; authorised domain `tahti.live`; privacy `https://tahti.live/privacy`; terms `https://tahti.live/terms`.
   - Scopes `openid`, `email`, `profile` (non-sensitive, no verification review). Publish the app to production.
   - Credentials → OAuth client ID → Web application. Authorised redirect URI `https://api.tahti.live/api/auth/oauth/google/callback`.
2. **Facebook** (developers.facebook.com, the Instagram integration's app if there is one):
   - Add the Facebook Login product. Valid OAuth Redirect URI `https://api.tahti.live/api/auth/oauth/facebook/callback`.
   - Permissions `email`, `public_profile` (standard access).
   - Privacy policy URL and data deletion instructions URL (e.g. `https://tahti.live/privacy` if its deletion section is enough for Meta). Switch the app to Live.
3. **Secrets** in `/srv/tahti/infra/stack.env` on vimage: `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `FACEBOOK_OAUTH_CLIENT_ID`, `FACEBOOK_OAUTH_CLIENT_SECRET` (or the `*_FILE` variants).
4. **Deploy:** nothing manual. Merging to tahti-org `main` redeploys vimage through the self-hosted GitHub Actions runner (`/srv/tahti` is owned by `gha-runner`; `scripts/deploy_prod.sh` run as a normal user fails with rsync permission errors). The OAuth routes are live since 2026-11-21 (`/api/auth/oauth/providers` answers `{"providers":[]}`). After adding the secrets, restart the api so it reads them: `ssh vimage 'cd /srv/tahti && docker compose -f infra/docker-compose.stack.yml --env-file infra/stack.env up -d api'`.
5. **Check:** `https://api.tahti.live/api/auth/oauth/providers` lists both; the sign-in dialog shows both buttons; sign in with a new account and with an existing verified email; link and disconnect from Settings → Security; set a password on a social-only account.

