# Onboarding "finish your profile" toast: seeding + once-per-session + screenshot hygiene

**Status:** open (later — sequence after current in-flight items)

Reported 2026-09-07, after repeatedly hitting this toast mid-testing this session (had to clear `[data-sonner-toast]` elements by hand to get real UI clicks through in both a bug-repro pass and a live-verification pass).

Three asks:

1. **Seeded/demo data shouldn't trigger this popup.** Any mock/seed user creation path should pre-mark onboarding as seen for that account.
2. **Show at most once per session, and honor "later" for the rest of that session** — not just on explicit "Not now" click.
3. **Mark onboarding done before taking automated screenshots** — a process note for agent/CI screenshot tooling, not just app code.

## Source (found this pass, not yet changed)

`packages/tahti-web/src/components/AppShell.tsx` (~line 326-346): a `useEffect` keyed on `[userId]` fires a Sonner toast ("Finish setting up your profile?") once per component mount when `!hasSeenOnboarding(userId)`. Cancel ("Not now") calls `markOnboardingSeen(userId)`, which persists `localStorage['tahti-web-onboarded:<userId>']= '1'` (`OnboardingView.tsx:58-66`) — permanent, and already exactly what ask #2 wants for the explicit-dismiss case.

The gap: the comment at `AppShell.tsx:326-329` says this is deliberate — "letting the toast time out without a click just offers it again next session." In practice "next session" == next full page mount, which happens on every hard navigation/reload, not just a real new browser session — so a user who lets it time out (or an automated flow that never clicks either button) sees it again on every reload. That's ask #2's actual complaint.

For ask #1 (seeding): `buildMockLoginUser`/mock session creation (`api/mock-session.ts`) doesn't call `markOnboardingSeen` anywhere — a freshly seeded mock user has no `tahti-web-onboarded:*` key, so the toast fires for them same as a real new signup.

For ask #3: `real-user-journeys.spec.ts`'s `signIn()` helper already does exactly this (sets the `tahti-web-onboarded:<userId>` flag right after login, specifically to avoid this toast) — that pattern should become the documented default for any agent driving this app with claude-in-chrome or Playwright for screenshots, not just that one spec file.

## Not yet decided

Whether "once per session" should mean sessionStorage-backed suppression (resets on true new browser session, matching the existing comment's intent) layered on top of the current permanent localStorage dismiss, or something else. Needs a decision, not a guess.
