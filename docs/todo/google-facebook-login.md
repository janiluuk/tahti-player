# Google and Facebook login

**Status:** open

Let listeners and artists sign up and log in with Google and Facebook, next to email and password.

## Known

- tahti-web has no social login today (no Google/Facebook auth routes or buttons found on 2026-11-11).
- OAuth app credentials for other services are an ops blocker in [dead-end-leftovers.md](dead-end-leftovers.md); Google and Facebook need their own OAuth apps (client id/secret, redirect URLs per host).
- Auth is JWT access + refresh ([auth-refresh-tokens.md](auth-refresh-tokens.md)); a social login has to end in the same token pair.

## Open questions

- Account linking: does a Google/Facebook login with an email that already has a Tahti account log into it, or ask to link first?
- Display name: the provider name must pass `safeDisplayName` (no emails as names); fall back to a generated username.
- Which hosts get the redirect URLs (production, beta, preview environments).

## Plan

- [ ] tahti-org API: OAuth start + callback for Google and Facebook, create or link the user, issue access + refresh tokens.
- [ ] Ops: create the Google and Facebook OAuth apps and add the secrets.
- [ ] tahti-web: "Continue with Google" / "Continue with Facebook" on log in and sign up (`@tahti-player/ui` `Button`), translated.
- [ ] Settings → Account: show and disconnect linked logins.
- [ ] e2e on the mock app.
