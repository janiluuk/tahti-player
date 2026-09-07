# "Theme is in review" toast reappears constantly

**Status:** open (later — sequence after current in-flight items)

Reported 2026-09-07: "there is constant 'theme is in review' notification. only show it once. not sure why its even showing, i dont recall any theme reviews being added" — also hit directly this session during live browser testing (`VITE_FORCE_MOCK=1`), independent of the report.

## Source (found this pass, not yet changed)

`packages/tahti-web/src/api/notifications.ts`'s `fetchStickyNotifications()`/`fetchNotifications()` (lines ~70-119, both `forceMock()` branches) unconditionally hardcode one fixture notification:

```
id: 'notification-mock-sticky', type: 'THEME_UNDER_REVIEW',
title: 'Theme is in review',
body: 'An admin will approve or reject it soon. This stays until you acknowledge it.'
```

This is why it shows with no real theme review ever having been submitted — it's demo/mock fixture data illustrating the sticky-toast pattern, not a real notification tied to anything the user did.

**Why it looks "constant":** `notificationInboxStore.ts`'s dedup (`seenIds`, `initialLoadDone`, lines ~22-23) is module-level in-memory state, not persisted — a full page reload/new tab resets it, so the sticky toast fires again on every reload, not just once per real session. Compounding this: `dismissNotification()` (`notifications.ts:160-168`) is a **complete no-op under `forceMock()`** (`if (forceMock()) return;`, doesn't record anything) — so clicking "Acknowledge" never actually clears it from the mock backend's notion of unread notifications; only the in-memory `seenIds` set (which a reload also wipes) was ever suppressing the repeat.

## Two separable things to fix

1. Make mock-mode acknowledge actually stick for the rest of that mock session (track dismissed ids in a module-level mock store, like `mock-session.ts`'s pattern for other mutable mock state) — so `dismissNotification('notification-mock-sticky')` really removes it from subsequent `fetchNotifications()` calls, not just from the transient `seenIds` toast-dedup set.
2. Same underlying class of bug as [onboarding-toast-noise.md](onboarding-toast-noise.md) (toast-suppression state that doesn't survive a reload) — worth fixing both with the same approach rather than two one-off patches, per the user's separate report about the onboarding toast.

Not decided: whether this specific mock fixture should keep existing at all (it's arguably just a UI-pattern demo, not needed for most testing) versus fixing its dismiss behavior — a product call, not guessed here.
