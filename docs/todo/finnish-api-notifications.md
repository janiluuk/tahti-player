# Finnish API notification bodies

**Status:** blocked  
**Updated:** 2026-11-19  
**Sibling:** `../tahti-org/docs/todo/finnish-api-notifications.md`

## Goal

Translate API notification bodies. Checking this off does not close
[`finnish-localization.md`](finnish-localization.md).

## Blocker

Language preference is client-only (`languageStore`). Org has no
`User.uiLocale` (or equivalent) to choose FI copy when creating notification
rows. See the org todo for the unblock plan (persist locale →
`notificationCopy` helper → migrate templates). Do not invent Finnish
strings in tahti-web for API-authored notifications.
