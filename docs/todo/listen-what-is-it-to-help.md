# Move "What is tahti.live?" out of Listen into Help

**Status:** open

## Ask (user, 2026-09-12)

Remove the "What is tahti.live?" button from Listen; move it to Help as a
section instead.

## Current state

- `packages/tahti-web/src/views/ListenView.tsx` (~line 245): when on the
  `listen` tab and the visitor is signed out, renders a `<Link to="/what-is-it">`
  wrapping a secondary `<Button>` labeled "What is tahti.live?".
- `/what-is-it` routes (`router.tsx`) to `src/views/WhatIsItView.tsx` (~793
  lines) — a standalone marketing-style page, not currently linked from
  anywhere in Help (`docs/VIEW-CATALOG.md` lists it as an orphan-ish
  "Marketing layout" with no story).
- Help content lives in `src/content/help.ts` as `HELP_ARTICLES` (each an
  `{ slug, title, description, sections: [{ heading, body, table? }] }`),
  rendered by the Help views/router (`/help`, `/help/$slug`).

## Suggested approach (not started)

1. Remove the signed-out "What is tahti.live?" button + its `Link` from
   `ListenView.tsx`.
2. Turn `WhatIsItView.tsx`'s content into a new Help article (or a section
   within an existing one, e.g. `getting-around`) in `help.ts` — decide
   which framing reads better once the content's actually reviewed, since
   793 lines of marketing copy may not fit as one `HelpArticle` cleanly.
3. Decide whether `/what-is-it` and `WhatIsItView.tsx` are deleted outright
   (if Help fully replaces it) or kept as a redirect to the new Help
   slug — check for other inbound links/CTAs pointing at `/what-is-it`
   first (marketing site, onboarding emails, etc. — outside this repo).
4. Update `docs/VIEW-CATALOG.md` and any Storybook coverage accordingly.
