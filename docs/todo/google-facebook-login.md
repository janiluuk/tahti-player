# Google and Facebook login

**Status:** partial

Let listeners and artists sign up and log in with Google and Facebook, next to email and password.

## Known

- tahti-web has no social login today (no Google/Facebook auth routes or buttons found on 2026-11-11).
- OAuth app credentials for other services are an ops blocker in [dead-end-leftovers.md](dead-end-leftovers.md); Google and Facebook need their own OAuth apps (client id/secret, redirect URLs per host).
- Auth is JWT access + refresh ([auth-refresh-tokens.md](auth-refresh-tokens.md)); a social login has to end in the same token pair.

## Decisions

- Account linking: a Google login whose email Google reports as verified auto-links to the Tahti account with that email. Facebook never auto-links: an existing account gets `oauth_error=email_in_use` and links Facebook from Settings → Security while signed in. Disconnect is refused (409) when it is the account's last way to sign in.
- Display name: the provider name must pass `safeDisplayName` (no emails as names); fall back to a generated username. The web shows a linked email only as account info in Settings → Security, never as a name.

## Web contract (as built in tahti-web)

- `GET /api/auth/oauth/providers` → `{ providers }`; buttons show only for listed providers, none when empty or failing.
- Start is a full-page navigation to `/api/auth/oauth/:provider/start?returnTo=<path>[&link=1]`. `returnTo` is the current path plus its query, so the API must append `oauth=ok` with `&` when `returnTo` already has a `?`.
- Return: `?oauth=ok` → session refresh + toast + param stripped; `?oauth_error=<code>` (`cancelled`, `email_in_use`, `already_linked`, `not_configured`, `failed`; unknown → `failed`) → auth dialog with the message when signed out, a toast when signed in.
- `GET /api/me/oauth-accounts`, `DELETE /api/me/oauth-accounts/:provider` (409 `{ error }` shown inline).
- Code: `packages/tahti-web/src/api/oauth.ts`, `src/lib/oauthReturn.ts`, `src/components/OAuthSignInButtons.tsx`, `OAuthReturnHandler.tsx` (mounted in `AppShell`), `LinkedLoginsSection.tsx` (Security → Password & email).

## Open questions

- Which hosts get the redirect URLs (production, beta, preview environments).

## Plan

- [x] tahti-web: "Continue with Google" / "Continue with Facebook" on log in and sign up, return handling, en + fi.
- [x] Settings → Security → Password & email: list, link and disconnect linked logins.
- [x] tahti-org API: OAuth start + callback for Google and Facebook, create or link the user, issue access + refresh tokens (branch `feat/oauth-google-facebook`). Accounts with 2FA come back as `?oauth=totp&challengeId=<id>`; the web opens the existing two-factor step with that challenge.
- [ ] Ops: create the Google and Facebook OAuth apps and add the secrets.
- [ ] Deploy the API and check the web flow end to end on beta (real redirects, cookies, `returnTo` with a query).
- [x] Mock-app e2e case in `e2e/roles-anonymous-listener.spec.ts` passes (2026-11-21).
- [ ] Set a password from Settings for accounts created with Google/Facebook (forgot-password skips accounts without one; org follow-up).
