# Mock live session does not survive reload / navigation

**Status:** open  
**Source:** Artist lifecycle e2e (`packages/tahti-web/docs/e2e-journeys/artist-lifecycle/ISSUES.md` P0)

## Problem

After Go Live shows “You're live…”, leaving for the public channel or reloading Prep drops to **OFFLINE**, encoder unchecked, Go Live disabled. Interval shots at 5–20m and the fan end-state are Off air.

## Likely cause

Mock signal (`Test connection`) is in-memory and cleared on reload; checklist can also contradict the live toast.

## Done when

- Mock (and ideally real) on-air state survives reload/navigation for the session, or
- UI stops claiming live when the signal is gone.
