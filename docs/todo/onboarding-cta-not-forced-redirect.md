# Onboarding: opt-in CTA after registration, not a forced redirect

**Status:** open

Roadmap item (2026-09-07): stop hijacking every new sign-in into `/onboarding`
and instead surface it as a dismissible CTA button the user can take (or
ignore) after they register.

## Current behavior

`AppShell.tsx:325-334` force-navigates any signed-in user who hasn't
completed onboarding to `/onboarding` on their first render of *any* route
this session:

```tsx
useEffect(() => {
  if (!userId || pathname === '/onboarding') return;
  if (!hasSeenOnboarding(userId)) {
    void navigate({ to: '/onboarding' });
  }
}, [userId, pathname, navigate]);
```

`hasSeenOnboarding`/`markOnboardingSeen` live in `views/OnboardingView.tsx`,
keyed `tahti-web-onboarded:<userId>` in localStorage. This hijack is annoying
enough in practice that the map-screenshot capture script has to fake the
onboarded flag for every signed-in shot just to reach the real page
(`scripts/capture-map-screens.mjs`'s `setLocalStorage`).

## Proposed change

- `/onboarding` stays a real, linkable route (already is).
- Remove (or gate way down — e.g. only truly first-session, not every route
  change) the automatic `navigate({ to: '/onboarding' })` hijack.
- Add a CTA (`Button` linking to `/onboarding`) shown after registration —
  candidate spots: the post-signup landing view, a Studio home banner, or a
  dismissible `EmptyState`/toast for `!hasSeenOnboarding(userId)` users.
  Needs a decision on exactly where this CTA lives.
- Dismissing/skipping the CTA should still call `markOnboardingSeen` (or a
  new "dismissed" flag) so it doesn't nag forever.

Not yet decided: exact CTA placement/copy, and whether "skip" and "never
ask again" should be distinct states.
