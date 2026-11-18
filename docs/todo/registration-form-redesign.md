# Registration form redesign

**Status:** open

## Goal

Re-design the Join / registration surface in `AuthDialog` so it feels modern and gives clear validation and error feedback — not a wall of fields with a single inline alert.

## Context

- Join lives in [`packages/tahti-web/src/components/AuthDialog.tsx`](../../packages/tahti-web/src/components/AuthDialog.tsx) (Storybook: `Tahti/Auth/AuthDialog`).
- Check-your-email after success is already a separate modal (mail-check icon + Got it).
- Password rules and mismatch already use `InlineError` / `aria-live`; username availability is a side hint. Layout and error presentation still feel sparse.

## Scope

- Modernize join layout (hierarchy, spacing, progressive clarity) while staying on `@tahti-player/ui` (`Input`, `SegmentedControl`, `Dialog`, `InlineError`, etc.).
- Clear field-level and form-level validation: empty required, password rules, mismatch, API errors, username taken — each with a proper indication (not only a bottom alert).
- Keep login and TOTP flows coherent; do not regress a11y (`aria-live`, labels).
- Update AuthDialog stories (idle join, validation errors, API error, success modal) and unit coverage.

## Out of scope

- Google / Facebook OAuth ([google-facebook-login.md](google-facebook-login.md)).
- Changing the API registration contract unless a clear gap blocks UX.
